// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptRuntime.h"
#include "JavaScriptValue.h"
#include "JavaScriptObject.h"
#include "Exceptions.h"
#include "JSIContext.h"
#include "JSIUtils.h"

namespace jsi = facebook::jsi;

namespace expo {

JavaScriptRuntime::JavaScriptRuntime(
  jsi::Runtime *runtime,
  std::shared_ptr<react::CallInvoker> jsInvoker
) : jsInvoker(std::move(jsInvoker)), runtime(runtime) {
}

jsi::Runtime &JavaScriptRuntime::get() const noexcept {
  return *runtime;
}

jni::local_ref<JavaScriptValue::javaobject>
JavaScriptRuntime::evaluateScript(const std::string &script) {
  auto scriptBuffer = std::make_shared<jsi::StringBuffer>(script);
  try {
    return JavaScriptValue::newInstance(
      getJSIContext(get()),
      weak_from_this(),
      std::make_shared<jsi::Value>(runtime->evaluateJavaScript(scriptBuffer, "<<evaluated>>"))
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
}

void JavaScriptRuntime::evaluateVoidScript(const std::string &script) {
  auto scriptBuffer = std::make_shared<jsi::StringBuffer>(script);
  try {
    runtime->evaluateJavaScript(scriptBuffer, "<<evaluated>>");
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
}

jni::local_ref<JavaScriptObject::javaobject> JavaScriptRuntime::global() noexcept {
  auto global = std::make_shared<jsi::Object>(runtime->global());
  return JavaScriptObject::newInstance(getJSIContext(get()), weak_from_this(), global);
}

jni::local_ref<JavaScriptObject::javaobject> JavaScriptRuntime::createObject() noexcept {
  auto newObject = std::make_shared<jsi::Object>(*runtime);
  return JavaScriptObject::newInstance(getJSIContext(get()), weak_from_this(), newObject);
}

void JavaScriptRuntime::drainJSEventLoop() {
  while (!runtime->drainMicrotasks()) {}
}

} // namespace expo
