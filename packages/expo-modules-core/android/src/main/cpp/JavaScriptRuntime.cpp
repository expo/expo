// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptRuntime.h"
#include "Exceptions.h"

#if FOR_HERMES

#include <hermes/hermes.h>

#include <utility>

#else

#include <jsi/JSCRuntime.h>

#endif

namespace expo {

namespace jsi = facebook::jsi;

JavaScriptRuntime::JavaScriptRuntime() {
#if FOR_HERMES
  auto config = ::hermes::vm::RuntimeConfig::Builder().withEnableSampleProfiling(false);
  runtime = facebook::hermes::makeHermesRuntime(config.build());
#else
  runtime = facebook::jsc::makeJSCRuntime();
#endif
}

JavaScriptRuntime::JavaScriptRuntime(
  jsi::Runtime *runtime,
  std::shared_ptr<react::CallInvoker> jsInvoker,
  std::shared_ptr<react::CallInvoker> nativeInvoker
) : jsInvoker(std::move(jsInvoker)), nativeInvoker(std::move(nativeInvoker)) {
  // Creating a shared pointer that points to the runtime but doesn't own it, thus doesn't release it.
  // In this code flow, the runtime should be owned by something else like the RCTBridge.
  // See explanation for constructor (8): https://en.cppreference.com/w/cpp/memory/shared_ptr/shared_ptr
  this->runtime = std::shared_ptr<jsi::Runtime>(std::shared_ptr<jsi::Runtime>(), runtime);
}

jsi::Runtime *JavaScriptRuntime::get() {
  return runtime.get();
}

jni::local_ref<JavaScriptValue::javaobject>
JavaScriptRuntime::evaluateScript(const std::string &script) {
  auto scriptBuffer = std::make_shared<jsi::StringBuffer>(script);
  std::shared_ptr<jsi::Value> result;
  try {
    result = std::make_shared<jsi::Value>(
      runtime->evaluateJavaScript(scriptBuffer, "<<evaluated>>")
    );
  } catch (const jsi::JSError &error) {
    jni::throwNewJavaException(
      JavaScriptEvaluateException::create(
        error.getMessage(),
        error.getStack()
      ).get()
    );
  } catch (const jsi::JSIException &error) {
    jni::throwNewJavaException(
      JavaScriptEvaluateException::create(
        error.what(),
        ""
      ).get()
    );
  }

  return JavaScriptValue::newObjectCxxArgs(weak_from_this(), result);
}

jni::local_ref<JavaScriptObject::javaobject> JavaScriptRuntime::global() {
  auto global = std::make_shared<jsi::Object>(runtime->global());
  return JavaScriptObject::newObjectCxxArgs(weak_from_this(), global);
}
} // namespace expo
