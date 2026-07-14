// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "RuntimeHolder.h"

#if UNIT_TEST

#include "ArrayBuffer.h"
#include "JavaScriptRuntime.h"
#include "JSHeapAccessExecutorHolder.h"
#include "TestingSyncJSCallInvoker.h"

#if USE_HERMES

#include <hermes/hermes.h>

#include <utility>

#else

#include <jsc/JSCRuntime.h>

#endif

#endif // UNIT_TEST

namespace expo {

void RuntimeHolder::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", RuntimeHolder::initHybrid),
                   makeNativeMethod("createRuntime", RuntimeHolder::createRuntime),
                   makeNativeMethod("createCallInvoker", RuntimeHolder::createCallInvoker),
                   makeNativeMethod(
                     "accessExpiredJavaScriptBackedArrayBuffer",
                     RuntimeHolder::accessExpiredJavaScriptBackedArrayBuffer
                   ),
                   makeNativeMethod(
                     "accessExpiredJavaScriptBackedArrayBufferAsync",
                     RuntimeHolder::accessExpiredJavaScriptBackedArrayBufferAsync
                   ),
                   makeNativeMethod("release", RuntimeHolder::release),
                 });
}

jni::local_ref<RuntimeHolder::jhybriddata> RuntimeHolder::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance();
}

jlong RuntimeHolder::createRuntime() {
#if !UNIT_TEST
  throw std::logic_error(
    "The RuntimeHolder constructor is only available when UNIT_TEST is defined.");
#else
#if USE_HERMES
  auto config = ::hermes::vm::RuntimeConfig::Builder()
    .withEnableSampleProfiling(false);
  runtime = facebook::hermes::makeHermesRuntime(config.build());

  // This version of the Hermes uses a Promise implementation that is provided by the RN.
  // The `setImmediate` function isn't defined, but is required by the Promise implementation.
  // That's why we inject it here.
  auto setImmediatePropName = jsi::PropNameID::forUtf8(*runtime, "setImmediate");
  runtime->global().setProperty(
    *runtime,
    setImmediatePropName,
    jsi::Function::createFromHostFunction(
      *runtime,
      setImmediatePropName,
      1,
      [](jsi::Runtime &rt,
         const jsi::Value &thisVal,
         const jsi::Value *args,
         size_t count) {
        args[0].asObject(rt).asFunction(rt).call(rt);
        return jsi::Value::undefined();
      }
    )
  );
#else
  runtime = facebook::jsc::makeJSCRuntime();
#endif

  // By default "global" property isn't set.
  runtime->global().setProperty(
    *runtime,
    jsi::PropNameID::forUtf8(*runtime, "global"),
    runtime->global()
  );

  // Mock the CodedError that in a typical scenario will be defined by the `expo-modules-core`.
  // Note: we can't use `class` syntax here, because Hermes doesn't support it.
  runtime->evaluateJavaScript(
    std::make_shared<jsi::StringBuffer>(
      "function CodedError(code, message) {\n"
      "    this.code = code;\n"
      "    this.message = message;\n"
      "    this.stack = (new Error).stack;\n"
      "}\n"
      "CodedError.prototype = new Error;\n"
      "global.ExpoModulesCore_CodedError = CodedError"
    ),
    "<<evaluated>>"
  );

  return reinterpret_cast<jlong>(runtime.get());
#endif
}

void RuntimeHolder::release() {
  runtime.reset();
}

jni::local_ref<react::CallInvokerHolder::javaobject> RuntimeHolder::createCallInvoker() {
#if !UNIT_TEST
  throw std::logic_error(
    "The RuntimeHolder::createCallInvoker is only available when UNIT_TEST is defined.");
#else
  return react::CallInvokerHolder::newObjectCxxArgs(std::make_shared<TestingSyncJSCallInvoker>(runtime));
#endif
}

void RuntimeHolder::accessExpiredJavaScriptBackedArrayBuffer(
  jni::alias_ref<JSHeapAccessExecutorJavaClass::javaobject> executor
) {
#if !UNIT_TEST
  throw std::logic_error(
    "Expired JavaScript-backed ArrayBuffer access is only available when UNIT_TEST is defined."
  );
#else
  auto storage = std::make_shared<JavaScriptBackedArrayBufferStorage>(
    std::weak_ptr<JavaScriptRuntime>{},
    std::make_shared<JSHeapAccessExecutorHolder>(executor),
    nullptr,
    0,
    0
  );
  storage->readBytes(0, nullptr, 0);
#endif
}

void RuntimeHolder::accessExpiredJavaScriptBackedArrayBufferAsync(
  jni::alias_ref<JSHeapAccessExecutorJavaClass::javaobject> executor,
  jni::alias_ref<JNIFunctionBody::javaobject> body,
  jni::alias_ref<ArrayBufferScopedAccessAsyncCallback::javaobject> callback,
  jni::alias_ref<ArrayBufferScopedAccessAsyncQueueFailureCallback::javaobject> queueFailureCallback
) {
#if !UNIT_TEST
  throw std::logic_error(
    "Expired JavaScript-backed ArrayBuffer async access is only available when UNIT_TEST is defined."
  );
#else
  auto storage = std::make_shared<JavaScriptBackedArrayBufferStorage>(
    std::weak_ptr<JavaScriptRuntime>{},
    std::make_shared<JSHeapAccessExecutorHolder>(executor),
    nullptr,
    0,
    0
  );
  storage->withJSBytesAsync(body, callback, queueFailureCallback);
#endif
}

} // namespace expo
