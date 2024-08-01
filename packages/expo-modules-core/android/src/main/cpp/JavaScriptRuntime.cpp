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
) : jsInvoker(std::move(jsInvoker)) {
  // Creating a shared pointer that points to the runtime but doesn't own it, thus doesn't release it.
  // In this code flow, the runtime should be owned by something else like the CatalystInstance.
  // See explanation for constructor (8): https://en.cppreference.com/w/cpp/memory/shared_ptr/shared_ptr
  this->runtime = std::shared_ptr<jsi::Runtime>(std::shared_ptr<jsi::Runtime>(), runtime);
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

void JavaScriptRuntime::installMainObject() {
  auto coreModule = getJSIContext(get())->getCoreModule();

  // As opposed to other modules, the core module is represented by a raw JS object instead of an instance of NativeModule class.
  mainObject = std::make_shared<jsi::Object>(*runtime);

  // Decorate the core object based on the module definition.
  for (const auto &decorator : coreModule->cthis()->decorators) {
    decorator->decorate(*runtime, *mainObject);
  }

  auto global = runtime->global();

  jsi::Object descriptor = JavaScriptObject::preparePropertyDescriptor(*runtime, 1 << 1);

  descriptor.setProperty(*runtime, "value", jsi::Value(*runtime, *mainObject));

  common::defineProperty(
    *runtime,
    &global,
    "expo",
    std::move(descriptor)
  );
}

std::shared_ptr<jsi::Object> JavaScriptRuntime::getMainObject() noexcept {
  return mainObject;
}
} // namespace expo
