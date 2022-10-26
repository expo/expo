#include "MethodMetadata.h"
#include "JSIInteropModuleRegistry.h"
#include "JavaScriptValue.h"
#include "JavaScriptObject.h"
#include "CachedReferencesRegistry.h"

#include <utility>

#include "react/jni/ReadableNativeMap.h"
#include "react/jni/ReadableNativeArray.h"

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

// Modified version of the RN implementation
// https://github.com/facebook/react-native/blob/7dceb9b63c0bfd5b13bf6d26f9530729506e9097/ReactCommon/react/nativemodule/core/platform/android/ReactCommon/JavaTurboModule.cpp#L57
jni::local_ref<react::JCxxCallbackImpl::JavaPart> createJavaCallbackFromJSIFunction(
  jsi::Function &&function,
  std::weak_ptr<react::LongLivedObjectCollection> longLivedObjectCollection,
  jsi::Runtime &rt,
  std::shared_ptr<react::CallInvoker> jsInvoker
) {
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
    [weakWrapper, callbackWrapperOwner, wrapperWasCalled = false](
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
        [weakWrapper, callbackWrapperOwner, responses]() mutable {
          auto strongWrapper2 = weakWrapper.lock();
          if (!strongWrapper2) {
            return;
          }

          jsi::Value args =
            jsi::valueFromDynamic(strongWrapper2->runtime(), responses);
          auto argsArray = args.getObject(strongWrapper2->runtime())
            .asArray(strongWrapper2->runtime());
          jsi::Value arg = argsArray.getValueAtIndex(strongWrapper2->runtime(), 0);

          strongWrapper2->callback().call(
            strongWrapper2->runtime(),
            (const jsi::Value *) &arg,
            (size_t) 1
          );

          callbackWrapperOwner.reset();
        });

      wrapperWasCalled = true;
    };

  return react::JCxxCallbackImpl::newObjectCxxArgs(fn);
}

std::vector<jvalue> MethodMetadata::convertJSIArgsToJNI(
  JSIInteropModuleRegistry *moduleRegistry,
  JNIEnv *env,
  jsi::Runtime &rt,
  const jsi::Value *args,
  size_t count,
  bool returnGlobalReferences
) {
  std::vector<jvalue> result(count);

  auto makeGlobalIfNecessary = [env, returnGlobalReferences](jobject obj) -> jobject {
    if (returnGlobalReferences) {
      return env->NewGlobalRef(obj);
    }
    return obj;
  };

  for (unsigned int argIndex = 0; argIndex < count; argIndex++) {
    const jsi::Value *arg = &args[argIndex];
    jvalue *jarg = &result[argIndex];
    int desiredType = desiredTypes[argIndex];

    if (desiredType & CppType::JS_VALUE) {
      jarg->l = makeGlobalIfNecessary(
        JavaScriptValue::newObjectCxxArgs(
          moduleRegistry->runtimeHolder->weak_from_this(),
          // TODO(@lukmccall): make sure that copy here is necessary
          std::make_shared<jsi::Value>(jsi::Value(rt, *arg))
        ).release()
      );
    } else if (desiredType & CppType::JS_OBJECT) {
      jarg->l = makeGlobalIfNecessary(
        JavaScriptObject::newObjectCxxArgs(
          moduleRegistry->runtimeHolder->weak_from_this(),
          std::make_shared<jsi::Object>(arg->getObject(rt))
        ).release()
      );
    } else if (arg->isNull() || arg->isUndefined()) {
      jarg->l = nullptr;
    } else if (arg->isNumber()) {
      auto &doubleClass = CachedReferencesRegistry::instance()
        ->getJClass("java/lang/Double");
      jmethodID doubleConstructor = doubleClass.getMethod("<init>", "(D)V");
      jarg->l = makeGlobalIfNecessary(
        env->NewObject(doubleClass.clazz, doubleConstructor, arg->getNumber()));
    } else if (arg->isBool()) {
      auto &booleanClass = CachedReferencesRegistry::instance()
        ->getJClass("java/lang/Boolean");
      jmethodID booleanConstructor = booleanClass.getMethod("<init>", "(Z)V");
      jarg->l = makeGlobalIfNecessary(
        env->NewObject(booleanClass.clazz, booleanConstructor, arg->getBool()));
    } else if (arg->isString()) {
      jarg->l = makeGlobalIfNecessary(env->NewStringUTF(arg->getString(rt).utf8(rt).c_str()));
    } else if (arg->isObject()) {
      const jsi::Object object = arg->getObject(rt);

      // TODO(@lukmccall): stop using dynamic
      auto dynamic = jsi::dynamicFromValue(rt, *arg);
      if (arg->getObject(rt).isArray(rt)) {
        jarg->l = makeGlobalIfNecessary(
          react::ReadableNativeArray::newObjectCxxArgs(std::move(dynamic)).release());
      } else {
        jarg->l = makeGlobalIfNecessary(
          react::ReadableNativeMap::createWithContents(std::move(dynamic)).release());
      }
    } else {
      // TODO(@lukmccall): throw an exception
      jarg->l = nullptr;
    }
  }

  return result;
}

MethodMetadata::MethodMetadata(
  std::weak_ptr<react::LongLivedObjectCollection> longLivedObjectCollection,
  std::string name,
  int args,
  bool isAsync,
  std::unique_ptr<int[]> desiredTypes,
  jni::global_ref<jobject> &&jBodyReference
) : longLivedObjectCollection_(longLivedObjectCollection),
    name(std::move(name)),
    args(args),
    isAsync(isAsync),
    desiredTypes(std::move(desiredTypes)),
    jBodyReference(std::move(jBodyReference)) {}

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
    jsi::PropNameID::forAscii(runtime, name),
    args,
    [this, moduleRegistry](
      jsi::Runtime &rt,
      const jsi::Value &thisValue,
      const jsi::Value *args,
      size_t count
    ) -> jsi::Value {
      return this->callSync(
        rt,
        moduleRegistry,
        args,
        count
      );
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

  std::vector<jvalue> convertedArgs = convertJSIArgsToJNI(moduleRegistry, env, rt, args, count,
                                                          false);

  // TODO(@lukmccall): Remove this temp array
  auto tempArray = env->NewObjectArray(
    convertedArgs.size(),
    CachedReferencesRegistry::instance()->getJClass("java/lang/Object").clazz,
    nullptr
  );
  for (size_t i = 0; i < convertedArgs.size(); i++) {
    env->SetObjectArrayElement(tempArray, i, convertedArgs[i].l);
  }

  // Cast in this place is safe, cause we know that this function is promise-less.
  auto syncFunction = jni::static_ref_cast<JNIFunctionBody>(this->jBodyReference);
  auto result = syncFunction->invoke(
    tempArray
  );

  if (result == nullptr) {
    return jsi::Value::undefined();
  }

  return jsi::valueFromDynamic(rt, result->cthis()->consume())
    .asObject(rt)
    .asArray(rt)
    .getValueAtIndex(rt, 0);
}

jsi::Function MethodMetadata::toAsyncFunction(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *moduleRegistry
) {
  return jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, name),
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
      std::vector<jvalue> convertedArgs = convertJSIArgsToJNI(moduleRegistry, env, rt, args, count,
                                                              true);

      auto Promise = rt.global().getPropertyAsFunction(rt, "Promise");
      // Creates a JSI promise
      jsi::Value promise = Promise.callAsConstructor(
        rt,
        createPromiseBody(rt, moduleRegistry, std::move(convertedArgs))
      );
      return promise;
    }
  );
}

jsi::Function MethodMetadata::createPromiseBody(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *moduleRegistry,
  std::vector<jvalue> &&args
) {
  return jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, "promiseFn"),
    2,
    [this, args = std::move(args), moduleRegistry](
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

      auto &runtimeHolder = moduleRegistry->runtimeHolder;
      jobject resolve = createJavaCallbackFromJSIFunction(
        std::move(resolveJSIFn),
        longLivedObjectCollection_,
        rt,
        runtimeHolder->jsInvoker
      ).release();

      jobject reject = createJavaCallbackFromJSIFunction(
        std::move(rejectJSIFn),
        longLivedObjectCollection_,
        rt,
        runtimeHolder->jsInvoker
      ).release();

      JNIEnv *env = jni::Environment::current();

      auto &jPromise = CachedReferencesRegistry::instance()->getJClass(
        "com/facebook/react/bridge/PromiseImpl");
      jmethodID jPromiseConstructor = jPromise.getMethod(
        "<init>",
        "(Lcom/facebook/react/bridge/Callback;Lcom/facebook/react/bridge/Callback;)V"
      );

      // Creates a promise object
      jobject promise = env->NewObject(
        jPromise.clazz,
        jPromiseConstructor,
        resolve,
        reject
      );

      auto argsSize = args.size();
      // TODO(@lukmccall): Remove this temp array
      auto tempArray = env->NewObjectArray(
        argsSize,
        CachedReferencesRegistry::instance()->getJClass("java/lang/Object").clazz,
        nullptr
      );
      for (size_t i = 0; i < argsSize; i++) {
        env->SetObjectArrayElement(tempArray, i, args[i].l);
      }

      // Cast in this place is safe, cause we know that this function expects promise.
      auto asyncFunction = jni::static_ref_cast<JNIAsyncFunctionBody>(this->jBodyReference);
      asyncFunction->invoke(
        tempArray,
        promise
      );

      // We have to remove the local reference to the promise object.
      // It doesn't mean that the promise will be deallocated, but rather that we move
      // the ownership to the `JNIAsyncFunctionBody`.
      env->DeleteLocalRef(promise);

      for (const auto &arg: args) {
        env->DeleteGlobalRef(arg.l);
      }
      env->DeleteLocalRef(tempArray);

      return jsi::Value::undefined();
    }
  );
}

} // namespace expo
