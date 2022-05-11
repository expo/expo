// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptModuleObject.h"
#include "JSIInteropModuleRegistry.h"

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <react/jni/ReadableNativeArray.h>
#include <fbjni/detail/Hybrid.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jni/JCallback.h>
#include <jsi/JSIDynamic.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <utility>
#include <tuple>
#include <algorithm>

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

jni::local_ref<jni::HybridClass<JavaScriptModuleObject>::jhybriddata>
JavaScriptModuleObject::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void JavaScriptModuleObject::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", JavaScriptModuleObject::initHybrid),
                   makeNativeMethod("registerSyncFunction",
                                    JavaScriptModuleObject::registerSyncFunction),
                   makeNativeMethod("registerAsyncFunction",
                                    JavaScriptModuleObject::registerAsyncFunction),
                 });
}

std::shared_ptr<jsi::Object> JavaScriptModuleObject::getJSIObject(jsi::Runtime &runtime) {
  if (jsiObject == nullptr) {
    auto hostObject = std::make_shared<JavaScriptModuleObject::HostObject>(this);
    jsiObject = std::make_shared<jsi::Object>(
      jsi::Object::createFromHostObject(runtime, hostObject));
  }

  return jsiObject;
}

void JavaScriptModuleObject::registerSyncFunction(jni::alias_ref<jstring> name, jint args) {
  auto cName = name->toStdString();
  methodsMetadata.try_emplace(cName, cName, args, false);
}

void JavaScriptModuleObject::registerAsyncFunction(jni::alias_ref<jstring> name, jint args) {
  auto cName = name->toStdString();
  methodsMetadata.emplace(std::piecewise_construct,
                          std::forward_as_tuple(cName),
                          std::forward_as_tuple(cName, args, true));
}

jni::local_ref<react::ReadableNativeArray::javaobject>
JavaScriptModuleObject::callSyncMethod(jni::local_ref<jstring> &&name,
                                       react::ReadableNativeArray::javaobject &&args) {
  static const auto method = JavaScriptModuleObject::javaClassLocal()
    ->getMethod<react::ReadableNativeArray::javaobject(
      jni::local_ref<jstring>,
      react::ReadableNativeArray::javaobject)>(
      "callSyncMethod"
    );

  return method(javaPart_.get(), std::move(name), args);
}

void JavaScriptModuleObject::callAsyncMethod(
  jni::local_ref<jstring> &&name,
  react::ReadableNativeArray::javaobject &&args,
  jobject promise
) {
  static const auto method = JavaScriptModuleObject::javaClassLocal()
    ->getMethod<void(
      jni::local_ref<jstring>,
      react::ReadableNativeArray::javaobject,
      jobject
    )>(
      "callAsyncMethod"
    );

  method(javaPart_.get(), std::move(name), args, promise);
}

JavaScriptModuleObject::HostObject::HostObject(
  JavaScriptModuleObject *jsModule) : jsModule(jsModule) {}

jsi::Value JavaScriptModuleObject::HostObject::get(jsi::Runtime &runtime,
                                                   const jsi::PropNameID &name) {
  auto cName = name.utf8(runtime);
  auto metadataRecord = jsModule->methodsMetadata.find(cName);
  if (metadataRecord == jsModule->methodsMetadata.end()) {
    return jsi::Value::undefined();
  }
  auto metadata = metadataRecord->second;

  if (metadata.body == nullptr) {
    if (!metadata.isAsync) {
      metadata.body = std::make_shared<jsi::Function>(
        createSyncFunctionCaller(runtime, cName, metadata.args));
    } else {
      metadata.body = std::make_shared<jsi::Function>(
        createAsyncFunctionCaller(runtime, cName, metadata.args)
      );
    }
  }

  return jsi::Value(runtime, *metadata.body);
}

void
JavaScriptModuleObject::HostObject::set(jsi::Runtime &runtime, const jsi::PropNameID &name,
                                        const jsi::Value &value) {
  throw jsi::JSError(
    runtime,
    "RuntimeError: Cannot override the host object for expo module '" + name.utf8(runtime) + "'"
  );
}

std::vector<jsi::PropNameID>
JavaScriptModuleObject::HostObject::getPropertyNames(jsi::Runtime &rt) {
  auto metadata = jsModule->methodsMetadata;
  std::vector<jsi::PropNameID> result;
  std::transform(
    metadata.begin(),
    metadata.end(),
    std::back_inserter(result),
    [&rt](const auto &kv) {
      return jsi::PropNameID::forUtf8(rt, kv.first);
    }
  );

  return result;
}

jsi::Function JavaScriptModuleObject::HostObject::createSyncFunctionCaller(
  jsi::Runtime &runtime,
  const std::string &name,
  int argsNumber
) {
  return jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, name),
    argsNumber,
    [this, name](
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

      auto result = jsModule->callSyncMethod(
        jni::make_jstring(name),
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

jsi::Function JavaScriptModuleObject::HostObject::createAsyncFunctionCaller(
  jsi::Runtime &runtime,
  const std::string &name,
  int argsNumber
) {
  return jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, name),
    argsNumber,
    [this, name](
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
      jsi::Value promise = Promise.callAsConstructor(
        rt,
        createPromiseBody(rt, name, std::move(dynamicArray))
      );
      return promise;
    }
  );
}

jsi::Function JavaScriptModuleObject::HostObject::createPromiseBody(
  jsi::Runtime &runtime,
  const std::string &name,
  folly::dynamic &&args
) {
  return jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, "promiseFn"),
    2,
    [this, args = std::move(args), name](
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
        jsModule->jsiInteropModuleRegistry->jsInvoker
      ).release();

      jobject reject = createJavaCallbackFromJSIFunction(
        std::move(rejectJSIFn),
        rt,
        jsModule->jsiInteropModuleRegistry->jsInvoker
      ).release();

      JNIEnv *env = jni::Environment::current();

      jclass jPromiseImpl =
        env->FindClass("com/facebook/react/bridge/PromiseImpl");
      jmethodID jPromiseImplConstructor = env->GetMethodID(
        jPromiseImpl,
        "<init>",
        "(Lcom/facebook/react/bridge/Callback;Lcom/facebook/react/bridge/Callback;)V");

      jobject promise = env->NewObject(
        jPromiseImpl,
        jPromiseImplConstructor,
        resolve,
        reject
      );

      jsModule->callAsyncMethod(
        jni::make_jstring(name),
        react::ReadableNativeArray::newObjectCxxArgs(args).get(),
        promise
      );

      env->DeleteLocalRef(promise);

      return jsi::Value::undefined();
    }
  );
}
} // namespace expo
