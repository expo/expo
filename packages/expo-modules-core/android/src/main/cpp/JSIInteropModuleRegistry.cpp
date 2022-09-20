// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSIInteropModuleRegistry.h"
#include "ExpoModulesHostObject.h"

#include <fbjni/detail/Meta.h>
#include <fbjni/fbjni.h>

#include <memory>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {
jni::local_ref<JSIInteropModuleRegistry::jhybriddata>
JSIInteropModuleRegistry::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void JSIInteropModuleRegistry::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", JSIInteropModuleRegistry::initHybrid),
                   makeNativeMethod("installJSI", JSIInteropModuleRegistry::installJSI),
                   makeNativeMethod("installJSIForTests",
                                    JSIInteropModuleRegistry::installJSIForTests),
                   makeNativeMethod("evaluateScript", JSIInteropModuleRegistry::evaluateScript),
                   makeNativeMethod("global", JSIInteropModuleRegistry::global),
                   makeNativeMethod("createObject", JSIInteropModuleRegistry::createObject),
                   makeNativeMethod("drainJSEventLoop", JSIInteropModuleRegistry::drainJSEventLoop),
                 });
}

JSIInteropModuleRegistry::JSIInteropModuleRegistry(jni::alias_ref<jhybridobject> jThis)
  : javaPart_(jni::make_global(jThis)) {}

void JSIInteropModuleRegistry::installJSI(
  jlong jsRuntimePointer,
  jni::alias_ref<react::CallInvokerHolder::javaobject> jsInvokerHolder,
  jni::alias_ref<react::CallInvokerHolder::javaobject> nativeInvokerHolder
) {
  auto runtime = reinterpret_cast<jsi::Runtime *>(jsRuntimePointer);
  runtimeHolder = std::make_shared<JavaScriptRuntime>(
    runtime,
    jsInvokerHolder->cthis()->getCallInvoker(),
    nativeInvokerHolder->cthis()->getCallInvoker()
  );

  auto expoModules = std::make_shared<ExpoModulesHostObject>(this);
  auto expoModulesObject = jsi::Object::createFromHostObject(*runtime, expoModules);

  runtime
    ->global()
    .setProperty(
      *runtime,
      "ExpoModules",
      std::move(expoModulesObject)
    );
}

void JSIInteropModuleRegistry::installJSIForTests() {
#if !UNIT_TEST
  throw std::logic_error("The function is only available when UNIT_TEST is defined.");
#else
  runtimeHolder = std::make_shared<JavaScriptRuntime>();
  jsi::Runtime &jsiRuntime = *runtimeHolder->get();

  auto expoModules = std::make_shared<ExpoModulesHostObject>(this);
  auto expoModulesObject = jsi::Object::createFromHostObject(jsiRuntime, expoModules);

  jsiRuntime
    .global()
    .setProperty(
      jsiRuntime,
      "ExpoModules",
      std::move(expoModulesObject)
    );
#endif // !UNIT_TEST
}

jni::local_ref<JavaScriptModuleObject::javaobject>
JSIInteropModuleRegistry::callGetJavaScriptModuleObjectMethod(const std::string &moduleName) const {
  const static auto method = expo::JSIInteropModuleRegistry::javaClassLocal()
    ->getMethod<jni::local_ref<JavaScriptModuleObject::javaobject>(
      std::string)>(
      "getJavaScriptModuleObject"
    );

  return method(javaPart_, moduleName);
}

jni::local_ref<jni::JArrayClass<jni::JString>>
JSIInteropModuleRegistry::callGetJavaScriptModulesNames() const {
  const static auto method = expo::JSIInteropModuleRegistry::javaClassLocal()
    ->getMethod<jni::local_ref<jni::JArrayClass<jni::JString>>()>(
      "getJavaScriptModulesName"
    );
  return method(javaPart_);
}

jni::local_ref<JavaScriptModuleObject::javaobject>
JSIInteropModuleRegistry::getModule(const std::string &moduleName) const {
  return callGetJavaScriptModuleObjectMethod(moduleName);
}

jni::local_ref<jni::JArrayClass<jni::JString>> JSIInteropModuleRegistry::getModulesName() const {
  return callGetJavaScriptModulesNames();
}

jni::local_ref<JavaScriptValue::javaobject> JSIInteropModuleRegistry::evaluateScript(
  jni::JString script
) {
  return runtimeHolder->evaluateScript(script.toStdString());
}

jni::local_ref<JavaScriptObject::javaobject> JSIInteropModuleRegistry::global() {
  return runtimeHolder->global();
}

jni::local_ref<JavaScriptObject::javaobject> JSIInteropModuleRegistry::createObject() {
  return runtimeHolder->createObject();
}

void JSIInteropModuleRegistry::drainJSEventLoop() {
  runtimeHolder->drainJSEventLoop();
}
} // namespace expo
