// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSIInteropModuleRegistry.h"
#include "ExpoModulesHostObject.h"
#include "JavaReferencesCache.h"
#include "JSReferencesCache.h"
#include "SharedObject.h"
#include <android/log.h>

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
                   makeNativeMethod("setNativeStateForSharedObject",
                                    JSIInteropModuleRegistry::jniSetNativeStateForSharedObject),
                 });
}

JSIInteropModuleRegistry::JSIInteropModuleRegistry(jni::alias_ref<jhybridobject> jThis)
  : javaPart_(jni::make_global(jThis)) {}

JSIInteropModuleRegistry::~JSIInteropModuleRegistry() {
  // The runtime would be deallocated automatically.
  // However, we need to enforce the order of deallocations.
  // The runtime has to be deallocated before the JNI part.
  runtimeHolder.reset();
}

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

  prepareRuntime();
#endif // !UNIT_TEST
}

void JSIInteropModuleRegistry::prepareRuntime() {
  runtimeHolder->installMainObject();

  auto expoModules = std::make_shared<ExpoModulesHostObject>(this);
  auto expoModulesObject = jsi::Object::createFromHostObject(
    runtimeHolder->get(),
    expoModules
  );

  EventEmitter::installClass(runtimeHolder->get());

  // Define the `global.expo.modules` object.
  runtimeHolder
    ->getMainObject()
    ->setProperty(
      runtimeHolder->get(),
      "modules",
      expoModulesObject
    );

  SharedObject::installBaseClass(
    runtimeHolder->get(),
    [this](const SharedObject::ObjectId objectId) {
      deleteSharedObject(objectId);
    }
  );
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

void JSIInteropModuleRegistry::deleteSharedObject(int objectId) {
  const static auto method = expo::JSIInteropModuleRegistry::javaClassLocal()
    ->getMethod<void(int)>(
      "deleteSharedObject"
    );
  method(javaPart_, objectId);
}

void JSIInteropModuleRegistry::registerClass(
  jni::local_ref<jclass> native,
  jni::local_ref<JavaScriptObject::javaobject> jsClass
) {
  const static auto method = expo::JSIInteropModuleRegistry::javaClassLocal()
    ->getMethod<void(jni::local_ref<jclass>, jni::local_ref<JavaScriptObject::javaobject>)>(
      "registerClass"
    );
  method(javaPart_, std::move(native), std::move(jsClass));
}

jni::local_ref<JavaScriptObject::javaobject> JSIInteropModuleRegistry::getJavascriptClass(
  jni::local_ref<jclass> native
) {
  const static auto method = expo::JSIInteropModuleRegistry::javaClassLocal()
    ->getMethod<jni::local_ref<JavaScriptObject::javaobject>(jni::local_ref<jclass>)>(
      "getJavascriptClass"
    );
  return method(javaPart_, std::move(native));
}

void JSIInteropModuleRegistry::jniWasDeallocated() {
  wasDeallocated = true;
}

void JSIInteropModuleRegistry::jniSetNativeStateForSharedObject(
  int id,
  jni::alias_ref<JavaScriptObject::javaobject> jsObject
) {
  auto nativeState = std::make_shared<expo::SharedObject::NativeState>(
    id,
    [this](int id) {
      deleteSharedObject(id);
    }
  );

  jsObject
    ->cthis()
    ->get()
    ->setNativeState(runtimeHolder->get(), std::move(nativeState));
}
} // namespace expo
