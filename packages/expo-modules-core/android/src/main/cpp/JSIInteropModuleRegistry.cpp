// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSIInteropModuleRegistry.h"
#include "ExpoModulesHostObject.h"
#include "JavaReferencesCache.h"
#include "JSReferencesCache.h"

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
                   makeNativeMethod("wasDeallocated", JSIInteropModuleRegistry::jniWasDeallocated),
                 });
}

JSIInteropModuleRegistry::JSIInteropModuleRegistry(jni::alias_ref<jhybridobject> jThis)
  : javaPart_(jni::make_global(jThis)) {}

void JSIInteropModuleRegistry::installJSI(
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
  jni::alias_ref<react::CallInvokerHolder::javaobject> jsInvokerHolder
) {
  this->jniDeallocator = jni::make_global(jniDeallocator);

  auto runtime = reinterpret_cast<jsi::Runtime *>(jsRuntimePointer);

  jsRegistry = std::make_unique<JSReferencesCache>(*runtime);

  runtimeHolder = std::make_shared<JavaScriptRuntime>(
    this,
    runtime,
    jsInvokerHolder->cthis()->getCallInvoker()
  );

  runtimeHolder->installMainObject();

  auto expoModules = std::make_shared<ExpoModulesHostObject>(this);
  auto expoModulesObject = jsi::Object::createFromHostObject(*runtime, expoModules);

  // Define the `global.expo.modules` object.
  runtimeHolder
    ->getMainObject()
    ->setProperty(
      *runtime,
      "modules",
      expoModulesObject
    );

  // Also define `global.ExpoModules` for backwards compatibility (used before SDK47, can be removed in SDK48).
  runtime
    ->global()
    .setProperty(
      *runtime,
      "ExpoModules",
      expoModulesObject
    );
}

void JSIInteropModuleRegistry::installJSIForTests(
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator
) {
#if !UNIT_TEST
  throw std::logic_error("The function is only available when UNIT_TEST is defined.");
#else
  this->jniDeallocator = jni::make_global(jniDeallocator);

  runtimeHolder = std::make_shared<JavaScriptRuntime>(this);
  jsi::Runtime &jsiRuntime = runtimeHolder->get();

  jsRegistry = std::make_unique<JSReferencesCache>(jsiRuntime);

  runtimeHolder->installMainObject();

  auto expoModules = std::make_shared<ExpoModulesHostObject>(this);
  auto expoModulesObject = jsi::Object::createFromHostObject(jsiRuntime, expoModules);

  runtimeHolder
    ->getMainObject()
    ->setProperty(
      jsiRuntime,
      "modules",
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

jni::local_ref<JavaScriptModuleObject::javaobject>
JSIInteropModuleRegistry::callGetCoreModuleObject() const {
  const static auto method = expo::JSIInteropModuleRegistry::javaClassLocal()
    ->getMethod<jni::local_ref<JavaScriptModuleObject::javaobject>()>(
      "getCoreModuleObject"
    );

  return method(javaPart_);
}

jni::local_ref<jni::JArrayClass<jni::JString>>
JSIInteropModuleRegistry::callGetJavaScriptModulesNames() const {
  const static auto method = expo::JSIInteropModuleRegistry::javaClassLocal()
    ->getMethod<jni::local_ref<jni::JArrayClass<jni::JString>>()>(
      "getJavaScriptModulesName"
    );
  return method(javaPart_);
}

bool JSIInteropModuleRegistry::callHasModule(const std::string &moduleName) const {
  const static auto method = expo::JSIInteropModuleRegistry::javaClassLocal()
    ->getMethod<jboolean(std::string)>(
      "hasModule"
    );
  return (bool) method(javaPart_, moduleName);
}

jni::local_ref<JavaScriptModuleObject::javaobject>
JSIInteropModuleRegistry::getModule(const std::string &moduleName) const {
  return callGetJavaScriptModuleObjectMethod(moduleName);
}

jni::local_ref<JavaScriptModuleObject::javaobject> JSIInteropModuleRegistry::getCoreModule() const {
  return callGetCoreModuleObject();
}

bool JSIInteropModuleRegistry::hasModule(const std::string &moduleName) const {
  return callHasModule(moduleName);
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

void JSIInteropModuleRegistry::registerSharedObject(
  jni::local_ref<jobject> native,
  jni::local_ref<JavaScriptObject::javaobject> js
) {
  const static auto method = expo::JSIInteropModuleRegistry::javaClassLocal()
    ->getMethod<void(jni::local_ref<jobject>, jni::local_ref<JavaScriptObject::javaobject>)>(
      "registerSharedObject"
    );
  method(javaPart_, std::move(native), std::move(js));
}

void JSIInteropModuleRegistry::jniWasDeallocated() {
  wasDeallocated = true;
}
} // namespace expo
