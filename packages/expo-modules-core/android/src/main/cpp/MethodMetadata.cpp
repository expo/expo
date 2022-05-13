#include "MethodMetadata.h"

#include "JSIInteropModuleRegistry.h"

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

// Modified version of the RN implementation
// https://github.com/facebook/react-native/blob/7dceb9b63c0bfd5b13bf6d26f9530729506e9097/ReactCommon/react/nativemodule/core/platform/android/ReactCommon/JavaTurboModule.cpp#L57
jni::local_ref<react::JCxxCallbackImpl::JavaPart> createJavaCallbackFromJSIFunction(
  jsi::Function &&function,
  jsi::Runtime &rt,
  std::shared_ptr<react::CallInvoker> jsInvoker
) {
  auto weakWrapper = react::CallbackWrapper::createWeak(std::move(function), rt,
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

MethodMetadata::MethodMetadata(
  std::string name,
  int args,
  bool isAsync,
  jni::global_ref<jobject> &&jBodyReference
) : name(name),
    args(args),
    isAsync(isAsync),
    jBodyReference(jBodyReference) {}

std::shared_ptr<jsi::Function> MethodMetadata::toJSFunction(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *moduleRegistry
) {
  if (body == nullptr) {
    if (isAsync) {
      body = std::make_shared<jsi::Function>(toAsyncFunction(runtime, moduleRegistry));
    } else {
      body = std::make_shared<jsi::Function>(toSyncFunction(runtime));
    }
  }

  return body;
}

jsi::Function MethodMetadata::toSyncFunction(jsi::Runtime &runtime) {
  return jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, name),
    args,
    [this](
      jsi::Runtime &rt,
      const jsi::Value &thisValue,
      const jsi::Value *args,
      size_t count
    ) -> jsi::Value {
      auto dynamicArray = folly::dynamic::array();
      for (int i = 0; i < count; i++) {
        auto &arg = args[i];
        dynamicArray.push_back(jsi::dynamicFromValue(rt, arg));
      }

      // Cast in this place is safe, cause we know that this function is promise-less.
      auto syncFunction = jni::static_ref_cast<JNIFunctionBody>(this->jBodyReference);
      auto result = syncFunction->invoke(
        react::ReadableNativeArray::newObjectCxxArgs(std::move(dynamicArray)).get()
      );

      if (result == nullptr) {
        return jsi::Value::undefined();
      }

      return jsi::valueFromDynamic(rt, result->cthis()->consume())
        .asObject(rt)
        .asArray(rt)
        .getValueAtIndex(rt, 0);
    });
}

jsi::Function
MethodMetadata::toAsyncFunction(jsi::Runtime &runtime, JSIInteropModuleRegistry *moduleRegistry) {
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
      auto dynamicArray = folly::dynamic::array();
      for (int i = 0; i < count; i++) {
        auto &arg = args[i];
        dynamicArray.push_back(jsi::dynamicFromValue(rt, arg));
      }

      auto Promise = rt.global().getPropertyAsFunction(rt, "Promise");
      // Creates a JSI promise
      jsi::Value promise = Promise.callAsConstructor(
        rt,
        createPromiseBody(rt, moduleRegistry, std::move(dynamicArray))
      );
      return promise;
    }
  );
}

jsi::Function MethodMetadata::createPromiseBody(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *moduleRegistry,
  folly::dynamic &&args
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

      jobject resolve = createJavaCallbackFromJSIFunction(
        std::move(resolveJSIFn),
        rt,
        moduleRegistry->jsInvoker
      ).release();

      jobject reject = createJavaCallbackFromJSIFunction(
        std::move(rejectJSIFn),
        rt,
        moduleRegistry->jsInvoker
      ).release();

      JNIEnv *env = jni::Environment::current();

      jclass jPromiseImpl =
        env->FindClass("com/facebook/react/bridge/PromiseImpl");
      jmethodID jPromiseImplConstructor = env->GetMethodID(
        jPromiseImpl,
        "<init>",
        "(Lcom/facebook/react/bridge/Callback;Lcom/facebook/react/bridge/Callback;)V");

      // Creates a promise object
      jobject promise = env->NewObject(
        jPromiseImpl,
        jPromiseImplConstructor,
        resolve,
        reject
      );

      // Cast in this place is safe, cause we know that this function expects promise.
      auto asyncFunction = jni::static_ref_cast<JNIAsyncFunctionBody>(this->jBodyReference);
      asyncFunction->invoke(
        react::ReadableNativeArray::newObjectCxxArgs(args).get(),
        promise
      );

      // We have to remove the local reference to the promise object.
      // It doesn't mean that the promise will be deallocated, but rather that we move
      // the ownership to the `JNIAsyncFunctionBody`.
      env->DeleteLocalRef(promise);

      return jsi::Value::undefined();
    }
  );
}

} // namespace expo
