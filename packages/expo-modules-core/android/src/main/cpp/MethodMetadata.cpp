#include "MethodMetadata.h"
#include "JSIInteropModuleRegistry.h"
#include "JavaScriptValue.h"
#include "JavaScriptObject.h"
#include "JavaScriptTypedArray.h"
#include "JavaReferencesCache.h"
#include "Exceptions.h"
#include "JavaCallback.h"

#include <utility>

#include <react/jni/ReadableNativeMap.h>
#include <react/jni/ReadableNativeArray.h>
#include <react/jni/WritableNativeArray.h>
#include <react/jni/WritableNativeMap.h>
#include "JSReferencesCache.h"

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

// Modified version of the RN implementation
// https://github.com/facebook/react-native/blob/7dceb9b63c0bfd5b13bf6d26f9530729506e9097/ReactCommon/react/nativemodule/core/platform/android/ReactCommon/JavaTurboModule.cpp#L57
jni::local_ref<JavaCallback::JavaPart> createJavaCallbackFromJSIFunction(
  jsi::Function &&function,
  std::weak_ptr<react::LongLivedObjectCollection> longLivedObjectCollection,
  jsi::Runtime &rt,
  JSIInteropModuleRegistry *moduleRegistry,
  bool isRejectCallback = false
) {
  std::shared_ptr<react::CallInvoker> jsInvoker = moduleRegistry->runtimeHolder->jsInvoker;
  auto strongLongLiveObjectCollection = longLivedObjectCollection.lock();
  if (!strongLongLiveObjectCollection) {
    throw std::runtime_error("The LongLivedObjectCollection for MethodMetadata is not alive.");
  }
  auto weakWrapper = react::CallbackWrapper::createWeak(strongLongLiveObjectCollection,
                                                        std::move(function), rt,
                                                        std::move(jsInvoker));

  // This needs to be a shared_ptr because:
  // 1. It cannot be unique_ptr. std::function is copyable but unique_ptr is
  // not.
  // 2. It cannot be weak_ptr since we need this object to live on.
  // 3. It cannot be a value, because that would be deleted as soon as this
  // function returns.
  auto callbackWrapperOwner =
    std::make_shared<react::RAIICallbackWrapperDestroyer>(weakWrapper);

  std::function<void(folly::dynamic)> fn =
    [
      weakWrapper,
      callbackWrapperOwner = std::move(callbackWrapperOwner),
      wrapperWasCalled = false,
      isRejectCallback
    ](
      folly::dynamic responses) mutable {
      if (wrapperWasCalled) {
        throw std::runtime_error(
          "callback 2 arg cannot be called more than once");
      }

      auto strongWrapper = weakWrapper.lock();
      if (!strongWrapper) {
        return;
      }

      strongWrapper->jsInvoker().invokeAsync(
        [
          weakWrapper,
          callbackWrapperOwner = std::move(callbackWrapperOwner),
          responses = std::move(responses),
          isRejectCallback
        ]() mutable {
          auto strongWrapper2 = weakWrapper.lock();
          if (!strongWrapper2) {
            return;
          }

          jsi::Value arg = jsi::valueFromDynamic(strongWrapper2->runtime(), responses);
          if (!isRejectCallback) {
            strongWrapper2->callback().call(
              strongWrapper2->runtime(),
              (const jsi::Value *) &arg,
              (size_t) 1
            );
          } else {
            auto &rt = strongWrapper2->runtime();
            auto jsErrorObject = arg.getObject(rt);
            auto errorCode = jsErrorObject.getProperty(rt, "code").asString(rt);
            auto message = jsErrorObject.getProperty(rt, "message").asString(rt);

            auto codedError = makeCodedError(
              rt,
              std::move(errorCode),
              std::move(message)
            );

            strongWrapper2->callback().call(
              strongWrapper2->runtime(),
              (const jsi::Value *) &codedError,
              (size_t) 1
            );
          }

          callbackWrapperOwner.reset();
        });

      wrapperWasCalled = true;
    };

  return JavaCallback::newObjectCxxArgs(std::move(fn));
}

jobjectArray MethodMetadata::convertJSIArgsToJNI(
  JSIInteropModuleRegistry *moduleRegistry,
  JNIEnv *env,
  jsi::Runtime &rt,
  const jsi::Value *args,
  size_t count
) {
  auto argumentArray = env->NewObjectArray(
    count,
    JavaReferencesCache::instance()->getJClass("java/lang/Object").clazz,
    nullptr
  );

  std::vector<jobject> result(count);

  for (unsigned int argIndex = 0; argIndex < count; argIndex++) {
    const jsi::Value &arg = args[argIndex];
    auto &type = argTypes[argIndex];
    if (arg.isNull() || arg.isUndefined()) {
      // If value is null or undefined, we just passes a null
      // Kotlin code will check if expected type is nullable.
      result[argIndex] = nullptr;
    } else {
      if (type->converter->canConvert(rt, arg)) {
        auto converterValue = type->converter->convert(rt, env, moduleRegistry, arg);
        env->SetObjectArrayElement(argumentArray, argIndex, converterValue);
        env->DeleteLocalRef(converterValue);
      } else {
        auto stringRepresentation = arg.toString(rt).utf8(rt);
        throwNewJavaException(
          UnexpectedException::create(
            "Cannot convert '" + stringRepresentation + "' to a Kotlin type.").get()
        );
      }
    }
  }

  return argumentArray;
}

MethodMetadata::MethodMetadata(
  std::weak_ptr<react::LongLivedObjectCollection> longLivedObjectCollection,
  std::string name,
  int args,
  bool isAsync,
  jni::local_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::global_ref<jobject> &&jBodyReference
) : name(std::move(name)),
    args(args),
    isAsync(isAsync),
    jBodyReference(std::move(jBodyReference)),
    longLivedObjectCollection_(longLivedObjectCollection) {
  argTypes.reserve(args);
  for (size_t i = 0; i < args; i++) {
    auto expectedType = expectedArgTypes->getElement(i);
    argTypes.push_back(
      std::make_unique<AnyType>(std::move(expectedType))
    );
  }
}

MethodMetadata::MethodMetadata(
  std::weak_ptr<react::LongLivedObjectCollection> longLivedObjectCollection,
  std::string name,
  int args,
  bool isAsync,
  std::vector<std::unique_ptr<AnyType>> &&expectedArgTypes,
  jni::global_ref<jobject> &&jBodyReference
) : name(std::move(name)),
    args(args),
    isAsync(isAsync),
    argTypes(std::move(expectedArgTypes)),
    jBodyReference(std::move(jBodyReference)),
    longLivedObjectCollection_(longLivedObjectCollection) {
}

std::shared_ptr<jsi::Function> MethodMetadata::toJSFunction(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *moduleRegistry
) {
  if (body == nullptr) {
    if (isAsync) {
      body = std::make_shared<jsi::Function>(toAsyncFunction(runtime, moduleRegistry));
    } else {
      body = std::make_shared<jsi::Function>(toSyncFunction(runtime, moduleRegistry));
    }
  }

  return body;
}

jsi::Function MethodMetadata::toSyncFunction(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *moduleRegistry
) {
  return jsi::Function::createFromHostFunction(
    runtime,
    moduleRegistry->jsRegistry->getPropNameID(runtime, name),
    args,
    [this, moduleRegistry](
      jsi::Runtime &rt,
      const jsi::Value &thisValue,
      const jsi::Value *args,
      size_t count
    ) -> jsi::Value {
      try {
        return this->callSync(
          rt,
          moduleRegistry,
          args,
          count
        );
      } catch (jni::JniException &jniException) {
        rethrowAsCodedError(rt, jniException);
      }
    });
}

jsi::Value MethodMetadata::callSync(
  jsi::Runtime &rt,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value *args,
  size_t count
) {
  if (this->jBodyReference == nullptr) {
    return jsi::Value::undefined();
  }

  JNIEnv *env = jni::Environment::current();

  /**
   * This will push a new JNI stack frame for the LocalReferences in this
   * function call. When the stack frame for this lambda is popped,
   * all LocalReferences are deleted.
   */
  jni::JniLocalScope scope(env, (int) count);

  auto convertedArgs = convertJSIArgsToJNI(moduleRegistry, env, rt, args, count);

  // Cast in this place is safe, cause we know that this function is promise-less.
  auto syncFunction = jni::static_ref_cast<JNIFunctionBody>(this->jBodyReference);
  auto result = syncFunction->invoke(
    convertedArgs
  );

  env->DeleteLocalRef(convertedArgs);
  if (result == nullptr) {
    return jsi::Value::undefined();
  }
  auto unpackedResult = result.get();
  auto cache = JavaReferencesCache::instance();
  if (env->IsInstanceOf(unpackedResult, cache->getJClass("java/lang/Double").clazz)) {
    return {jni::static_ref_cast<jni::JDouble>(result)->value()};
  }
  if (env->IsInstanceOf(unpackedResult, cache->getJClass("java/lang/Integer").clazz)) {
    return {jni::static_ref_cast<jni::JInteger>(result)->value()};
  }
  if (env->IsInstanceOf(unpackedResult, cache->getJClass("java/lang/String").clazz)) {
    return jsi::String::createFromUtf8(
      rt,
      jni::static_ref_cast<jni::JString>(result)->toStdString()
    );
  }
  if (env->IsInstanceOf(unpackedResult, cache->getJClass("java/lang/Boolean").clazz)) {
    return {(bool) jni::static_ref_cast<jni::JBoolean>(result)->value()};
  }
  if (env->IsInstanceOf(unpackedResult, cache->getJClass("java/lang/Float").clazz)) {
    return {(double) jni::static_ref_cast<jni::JFloat>(result)->value()};
  }
  if (env->IsInstanceOf(
    unpackedResult,
    cache->getJClass("com/facebook/react/bridge/WritableNativeArray").clazz
  )) {
    auto dynamic = jni::static_ref_cast<react::WritableNativeArray::javaobject>(result)
      ->cthis()
      ->consume();
    return jsi::valueFromDynamic(rt, dynamic);
  }
  if (env->IsInstanceOf(
    unpackedResult,
    cache->getJClass("com/facebook/react/bridge/WritableNativeMap").clazz
  )) {
    auto dynamic = jni::static_ref_cast<react::WritableNativeMap::javaobject>(result)
      ->cthis()
      ->consume();
    return jsi::valueFromDynamic(rt, dynamic);
  }

  return jsi::Value::undefined();
}

jsi::Function MethodMetadata::toAsyncFunction(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *moduleRegistry
) {
  return jsi::Function::createFromHostFunction(
    runtime,
    moduleRegistry->jsRegistry->getPropNameID(runtime, name),
    args,
    [this, moduleRegistry](
      jsi::Runtime &rt,
      const jsi::Value &thisValue,
      const jsi::Value *args,
      size_t count
    ) -> jsi::Value {
      JNIEnv *env = jni::Environment::current();

      /**
       * This will push a new JNI stack frame for the LocalReferences in this
       * function call. When the stack frame for this lambda is popped,
       * all LocalReferences are deleted.
       */
      jni::JniLocalScope scope(env, (int) count);

      auto &Promise = moduleRegistry->jsRegistry->getObject<jsi::Function>(
        JSReferencesCache::JSKeys::PROMISE
      );

      try {
        auto convertedArgs = convertJSIArgsToJNI(moduleRegistry, env, rt, args, count);
        auto globalConvertedArgs = (jobjectArray) env->NewGlobalRef(convertedArgs);
        env->DeleteLocalRef(convertedArgs);

        // Creates a JSI promise
        jsi::Value promise = Promise.callAsConstructor(
          rt,
          createPromiseBody(rt, moduleRegistry, globalConvertedArgs)
        );
        return promise;
      } catch (jni::JniException &jniException) {
        jni::local_ref<jni::JThrowable> unboxedThrowable = jniException.getThrowable();
        if (!unboxedThrowable->isInstanceOf(CodedException::javaClassLocal())) {
          unboxedThrowable = UnexpectedException::create(jniException.what());
        }

        auto codedException = jni::static_ref_cast<CodedException>(unboxedThrowable);
        auto code = codedException->getCode();
        auto message = codedException->getLocalizedMessage().value_or("");

        jsi::Value promise = Promise.callAsConstructor(
          rt,
          jsi::Function::createFromHostFunction(
            rt,
            moduleRegistry->jsRegistry->getPropNameID(rt, "promiseFn"),
            2,
            [code, message](
              jsi::Runtime &rt,
              const jsi::Value &thisVal,
              const jsi::Value *promiseConstructorArgs,
              size_t promiseConstructorArgCount
            ) {
              if (promiseConstructorArgCount != 2) {
                throw std::invalid_argument("Promise fn arg count must be 2");
              }

              jsi::Function rejectJSIFn = promiseConstructorArgs[1].getObject(rt).getFunction(rt);
              rejectJSIFn.call(
                rt,
                makeCodedError(
                  rt,
                  jsi::String::createFromUtf8(rt, code),
                  jsi::String::createFromUtf8(rt, message)
                )
              );
              return jsi::Value::undefined();
            }
          )
        );

        return promise;
      }
    }
  );
}

jsi::Function MethodMetadata::createPromiseBody(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *moduleRegistry,
  jobjectArray globalArgs
) {
  return jsi::Function::createFromHostFunction(
    runtime,
    moduleRegistry->jsRegistry->getPropNameID(runtime, "promiseFn"),
    2,
    [this, globalArgs, moduleRegistry](
      jsi::Runtime &rt,
      const jsi::Value &thisVal,
      const jsi::Value *promiseConstructorArgs,
      size_t promiseConstructorArgCount
    ) {
      if (promiseConstructorArgCount != 2) {
        throw std::invalid_argument("Promise fn arg count must be 2");
      }

      jsi::Function resolveJSIFn = promiseConstructorArgs[0].getObject(rt).getFunction(rt);
      jsi::Function rejectJSIFn = promiseConstructorArgs[1].getObject(rt).getFunction(rt);

      jobject resolve = createJavaCallbackFromJSIFunction(
        std::move(resolveJSIFn),
        longLivedObjectCollection_,
        rt,
        moduleRegistry
      ).release();

      jobject reject = createJavaCallbackFromJSIFunction(
        std::move(rejectJSIFn),
        longLivedObjectCollection_,
        rt,
        moduleRegistry,
        true
      ).release();

      JNIEnv *env = jni::Environment::current();

      auto &jPromise = JavaReferencesCache::instance()->getJClass(
        "expo/modules/kotlin/jni/PromiseImpl");
      jmethodID jPromiseConstructor = jPromise.getMethod(
        "<init>",
        "(Lexpo/modules/kotlin/jni/JavaCallback;Lexpo/modules/kotlin/jni/JavaCallback;)V"
      );

      // Creates a promise object
      jobject promise = env->NewObject(
        jPromise.clazz,
        jPromiseConstructor,
        resolve,
        reject
      );

      // Cast in this place is safe, cause we know that this function expects promise.
      auto asyncFunction = jni::static_ref_cast<JNIAsyncFunctionBody>(this->jBodyReference);
      asyncFunction->invoke(
        globalArgs,
        promise
      );

      // We have to remove the local reference to the promise object.
      // It doesn't mean that the promise will be deallocated, but rather that we move
      // the ownership to the `JNIAsyncFunctionBody`.
      env->DeleteLocalRef(promise);
      env->DeleteGlobalRef(globalArgs);

      return jsi::Value::undefined();
    }
  );
}
} // namespace expo
