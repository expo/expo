#include "MethodMetadata.h"
#include "JSIContext.h"
#include "JavaScriptValue.h"
#include "JavaScriptObject.h"
#include "JavaScriptTypedArray.h"
#include "JavaReferencesCache.h"
#include "Exceptions.h"
#include "JavaCallback.h"
#include "types/JNIToJSIConverter.h"
#include "JSReferencesCache.h"

#include <utility>
#include <functional>
#include <unistd.h>
#include <optional>

#include <ReactCommon/LongLivedObject.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

jni::local_ref<JavaCallback::JavaPart> createJavaCallback(
  jsi::Function &&resolveFunction,
  jsi::Function &&rejectFunction,
  jsi::Runtime &rt
) {
  JSIContext *jsiContext = getJSIContext(rt);
  std::shared_ptr<react::CallInvoker> jsInvoker = jsiContext->runtimeHolder->jsInvoker;

  std::shared_ptr<JavaCallback::CallbackContext> callbackContext = std::make_shared<JavaCallback::CallbackContext>(
    rt,
    std::move(jsInvoker),
    std::move(resolveFunction),
    std::move(rejectFunction)
  );

#if REACT_NATIVE_TARGET_VERSION >= 75
  facebook::react::LongLivedObjectCollection::get(rt).add(callbackContext);
#else
  facebook::react::LongLivedObjectCollection::get().add(callbackContext);
#endif

  return JavaCallback::newInstance(jsiContext, std::move(callbackContext));
}

jobjectArray MethodMetadata::convertJSIArgsToJNI(
  JNIEnv *env,
  jsi::Runtime &rt,
  const jsi::Value &thisValue,
  const jsi::Value *args,
  size_t count
) {
  // This function takes the owner, so the args number is higher because we have access to the thisValue.
  if (takesOwner) {
    count++;
  }

  // The `count < argTypes.size()` case is handled by the Kotlin part
  if (count > argTypes.size()) {
    throwNewJavaException(
      InvalidArgsNumberException::create(
        count,
        argTypes.size()
      ).get()
    );
  }

  auto argumentArray = env->NewObjectArray(
    count,
    JavaReferencesCache::instance()->getJClass("java/lang/Object").clazz,
    nullptr
  );


  const auto getCurrentArg = [&thisValue, args, takesOwner = takesOwner](
    size_t index
  ) -> const jsi::Value & {
    if (!takesOwner) {
      return args[index];
    }

    if (index != 0) {
      return args[index - 1];
    }
    return thisValue;
  };

  for (size_t argIndex = 0; argIndex < count; argIndex++) {
    const jsi::Value &arg = getCurrentArg(argIndex);
    auto &type = argTypes[argIndex];

    if (type->converter->canConvert(rt, arg)) {
      auto converterValue = type->converter->convert(rt, env, arg);
      env->SetObjectArrayElement(argumentArray, argIndex, converterValue);
      env->DeleteLocalRef(converterValue);
    } else if (arg.isNull() || arg.isUndefined()) {
      // If value is null or undefined, we just passes a null
      // Kotlin code will check if expected type is nullable.
      continue;
    } else {
      auto stringRepresentation = arg.toString(rt).utf8(rt);
      throwNewJavaException(
        UnexpectedException::create(
          "[" + this->name + "] Cannot convert '" + stringRepresentation +
          "' to a Kotlin type.").get()
      );
    }
  }

  return argumentArray;
}

MethodMetadata::MethodMetadata(
  std::string name,
  bool takesOwner,
  bool isAsync,
  jni::local_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::global_ref<jobject> &&jBodyReference
) : name(std::move(name)),
    takesOwner(takesOwner),
    isAsync(isAsync),
    jBodyReference(std::move(jBodyReference)) {
  size_t argsSize = expectedArgTypes->size();
  argTypes.reserve(argsSize);
  for (size_t i = 0; i < argsSize; i++) {
    auto expectedType = expectedArgTypes->getElement(i);
    argTypes.push_back(
      std::make_unique<AnyType>(std::move(expectedType))
    );
  }
}

MethodMetadata::MethodMetadata(
  std::string name,
  bool takesOwner,
  bool isAsync,
  std::vector<std::unique_ptr<AnyType>> &&expectedArgTypes,
  jni::global_ref<jobject> &&jBodyReference
) : name(std::move(name)),
    takesOwner(takesOwner),
    isAsync(isAsync),
    argTypes(std::move(expectedArgTypes)),
    jBodyReference(std::move(jBodyReference)) {
}

std::shared_ptr<jsi::Function> MethodMetadata::toJSFunction(
  jsi::Runtime &runtime
) {
  if (body == nullptr) {
    if (isAsync) {
      body = std::make_shared<jsi::Function>(toAsyncFunction(runtime));
    } else {
      body = std::make_shared<jsi::Function>(toSyncFunction(runtime));
    }
  }

  return body;
}

jsi::Function MethodMetadata::toSyncFunction(
  jsi::Runtime &runtime
) {
  auto weakThis = weak_from_this();
  return jsi::Function::createFromHostFunction(
    runtime,
    getJSIContext(runtime)->jsRegistry->getPropNameID(runtime, name),
    argTypes.size(),
    [weakThis = std::move(weakThis)](
      jsi::Runtime &rt,
      const jsi::Value &thisValue,
      const jsi::Value *args,
      size_t count
    ) -> jsi::Value {
      try {
        auto thisPtr = weakThis.lock();
        if (thisPtr == nullptr) {
          return jsi::Value::undefined();
        }

        return thisPtr->callSync(
          rt,
          thisValue,
          args,
          count
        );
      } catch (jni::JniException &jniException) {
        rethrowAsCodedError(rt, jniException);
      }
    });
}

jni::local_ref<jobject> MethodMetadata::callJNISync(
  JNIEnv *env,
  jsi::Runtime &rt,
  const jsi::Value &thisValue,
  const jsi::Value *args,
  size_t count
) {
  if (this->jBodyReference == nullptr) {
    return nullptr;
  }

  auto convertedArgs = convertJSIArgsToJNI(env, rt, thisValue, args, count);

  // Cast in this place is safe, cause we know that this function is promise-less.
  auto syncFunction = jni::static_ref_cast<JNIFunctionBody>(this->jBodyReference);
  auto result = syncFunction->invoke(
    convertedArgs
  );

  env->DeleteLocalRef(convertedArgs);
  return result;
}

jsi::Value MethodMetadata::callSync(
  jsi::Runtime &rt,
  const jsi::Value &thisValue,
  const jsi::Value *args,
  size_t count
) {
  JNIEnv *env = jni::Environment::current();
  /**
  * This will push a new JNI stack frame for the LocalReferences in this
  * function call. When the stack frame for this lambda is popped,
  * all LocalReferences are deleted.
  */
  jni::JniLocalScope scope(env, (int) count);

  auto result = this->callJNISync(env, rt, thisValue, args, count);
  return convert(env, rt, std::move(result));
}

jsi::Function MethodMetadata::toAsyncFunction(
  jsi::Runtime &runtime
) {
  auto weakThis = weak_from_this();
  return jsi::Function::createFromHostFunction(
    runtime,
    getJSIContext(runtime)->jsRegistry->getPropNameID(runtime, name),
    argTypes.size(),
    [weakThis = std::move(weakThis)](
      jsi::Runtime &rt,
      const jsi::Value &thisValue,
      const jsi::Value *args,
      size_t count
    ) -> jsi::Value {
      auto thisPtr = weakThis.lock();
      if (thisPtr == nullptr) {
        return jsi::Value::undefined();
      }

      JSIContext *jsiContext = getJSIContext(rt);
      JNIEnv *env = jni::Environment::current();

      /**
       * This will push a new JNI stack frame for the LocalReferences in this
       * function call. When the stack frame for this lambda is popped,
       * all LocalReferences are deleted.
       */
      jni::JniLocalScope scope(env, (int) count);

      auto &Promise = jsiContext->jsRegistry->getObject<jsi::Function>(
        JSReferencesCache::JSKeys::PROMISE
      );

      try {
        auto convertedArgs = thisPtr->convertJSIArgsToJNI(env, rt, thisValue, args, count);
        auto globalConvertedArgs = (jobjectArray) env->NewGlobalRef(convertedArgs);
        env->DeleteLocalRef(convertedArgs);

        // Creates a JSI promise
        jsi::Value promise = Promise.callAsConstructor(
          rt,
          thisPtr->createPromiseBody(rt, globalConvertedArgs)
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
            jsiContext->jsRegistry->getPropNameID(rt, "promiseFn"),
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
  jobjectArray globalArgs
) {
  return jsi::Function::createFromHostFunction(
    runtime,
    getJSIContext(runtime)->jsRegistry->getPropNameID(runtime, "promiseFn"),
    2,
    [this, globalArgs](
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

      jobject javaCallback = createJavaCallback(
        std::move(resolveJSIFn),
        std::move(rejectJSIFn),
        rt
      ).release();

      JNIEnv *env = jni::Environment::current();

      auto &jPromise = JavaReferencesCache::instance()->getJClass(
        "expo/modules/kotlin/jni/PromiseImpl");
      jmethodID jPromiseConstructor = jPromise.getMethod(
        "<init>",
        "(Lexpo/modules/kotlin/jni/JavaCallback;)V"
      );

      // Creates a promise object
      jobject promise = env->NewObject(
        jPromise.clazz,
        jPromiseConstructor,
        javaCallback
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
