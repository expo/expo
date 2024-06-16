// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptRuntime.h"
#include "JavaScriptValue.h"
#include "JavaScriptObject.h"
#include "Exceptions.h"
#include "JSIContext.h"
#include "JSIUtils.h"

#if UNIT_TEST

#include "TestingSyncJSCallInvoker.h"

#if USE_HERMES

#include <hermes/hermes.h>

#include <utility>

#else

#include <jsc/JSCRuntime.h>

#endif

#endif // UNIT_TEST

namespace jsi = facebook::jsi;

namespace expo {

JavaScriptRuntime::JavaScriptRuntime() {
#if !UNIT_TEST
  throw std::logic_error(
    "The JavaScriptRuntime constructor is only available when UNIT_TEST is defined.");
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

  jsInvoker = std::make_shared<TestingSyncJSCallInvoker>(runtime);

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
#endif // !UNIT_TEST
}

JavaScriptRuntime::JavaScriptRuntime(
  jsi::Runtime *runtime,
  std::shared_ptr<react::CallInvoker> jsInvoker
) : jsInvoker(std::move(jsInvoker)) {
  // Creating a shared pointer that points to the runtime but doesn't own it, thus doesn't release it.
  // In this code flow, the runtime should be owned by something else like the CatalystInstance.
  // See explanation for constructor (8): https://en.cppreference.com/w/cpp/memory/shared_ptr/shared_ptr
  this->runtime = std::shared_ptr<jsi::Runtime>(std::shared_ptr<jsi::Runtime>(), runtime);
}

jsi::Runtime &JavaScriptRuntime::get() const {
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

jni::local_ref<JavaScriptObject::javaobject> JavaScriptRuntime::global() {
  auto global = std::make_shared<jsi::Object>(runtime->global());
  return JavaScriptObject::newInstance(getJSIContext(get()), weak_from_this(), global);
}

jni::local_ref<JavaScriptObject::javaobject> JavaScriptRuntime::createObject() {
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
  coreModule->cthis()->decorate(*runtime, mainObject.get());

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

std::shared_ptr<jsi::Object> JavaScriptRuntime::getMainObject() {
  return mainObject;
}
} // namespace expo
