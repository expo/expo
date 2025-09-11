// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSIContext.h"
#include "Exceptions.h"
#include "ExpoModulesHostObject.h"
#include "JavaReferencesCache.h"
#include "JSReferencesCache.h"
#include "SharedObject.h"
#include "SharedRef.h"
#include "NativeModule.h"

#include <fbjni/detail/Meta.h>
#include <fbjni/fbjni.h>

#include <memory>

#if IS_NEW_ARCHITECTURE_ENABLED

#include "BridgelessJSCallInvoker.h"

#endif

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

#if IS_NEW_ARCHITECTURE_ENABLED

#include "BridgelessJSCallInvoker.h"

#endif

jni::local_ref<JSIContext::jhybriddata>
JSIContext::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void JSIContext::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", JSIContext::initHybrid),
                   makeNativeMethod("installJSI", JSIContext::installJSI),
#if IS_NEW_ARCHITECTURE_ENABLED
                   makeNativeMethod("installJSIForBridgeless",
                                    JSIContext::installJSIForBridgeless),
#endif
                   makeNativeMethod("evaluateScript", JSIContext::evaluateScript),
                   makeNativeMethod("evaluateVoidScript", JSIContext::evaluateVoidScript),
                   makeNativeMethod("global", JSIContext::global),
                   makeNativeMethod("createObject", JSIContext::createObject),
                   makeNativeMethod("drainJSEventLoop", JSIContext::drainJSEventLoop),
                   makeNativeMethod("setNativeStateForSharedObject",
                                    JSIContext::jniSetNativeStateForSharedObject),
                 });
}

JSIContext::JSIContext(jni::alias_ref<jhybridobject> jThis)
  : javaPart_(jni::make_global(jThis)),
    threadSafeJThis(std::make_shared<ThreadSafeJNIGlobalRef<JSIContext::javaobject>>(
      jni::Environment::current()->NewGlobalRef(javaPart_.get())
    )) {}

void JSIContext::installJSI(
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
  jni::alias_ref<react::CallInvokerHolder::javaobject> jsInvokerHolder
) noexcept {
  prepareJSIContext(
    jsRuntimePointer,
    jniDeallocator,
    jsInvokerHolder->cthis()->getCallInvoker()
  );

  prepareRuntime();
}

#if IS_NEW_ARCHITECTURE_ENABLED

void JSIContext::installJSIForBridgeless(
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
  jni::alias_ref<react::JRuntimeExecutor::javaobject> runtimeExecutor
) {
  prepareJSIContext(
    jsRuntimePointer,
    jniDeallocator,
    std::make_shared<BridgelessJSCallInvoker>(runtimeExecutor->cthis()->get())
  );

  prepareRuntime();
}

#endif

void JSIContext::prepareJSIContext(
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
  std::shared_ptr<react::CallInvoker> callInvoker
) noexcept {
  this->jniDeallocator = jni::make_global(jniDeallocator);
  auto runtime = reinterpret_cast<jsi::Runtime *>(jsRuntimePointer);
  jsRegistry = std::make_unique<JSReferencesCache>(*runtime);

  runtimeHolder = std::make_shared<JavaScriptRuntime>(
    runtime,
    std::move(callInvoker)
  );
}

void JSIContext::prepareRuntime() noexcept {
  jsi::Runtime &runtime = runtimeHolder->get();
  bindJSIContext(runtime, this);

  runtimeHolder->installMainObject();

  EventEmitter::installClass(runtime);
  SharedObject::installBaseClass(
    runtime,
    // We can't predict the order of deallocation of the JSIContext and the SharedObject.
    // So we need to pass a new ref to retain the JSIContext to make sure it's not deallocated before the SharedObject.
    [threadSafeRef = threadSafeJThis](const SharedObject::ObjectId objectId) {
      threadSafeRef->use([objectId](jni::alias_ref<JSIContext::javaobject> globalRef) {
        JSIContext::deleteSharedObject(globalRef, objectId);
      });
    }
  );
  SharedRef::installBaseClass(runtime);
  NativeModule::installClass(runtime);

  auto expoModules = std::make_shared<ExpoModulesHostObject>(this);
  auto expoModulesObject = jsi::Object::createFromHostObject(
    runtime,
    expoModules
  );

  // Define the `global.expo.modules` object.
  runtimeHolder
    ->getMainObject()
    ->setProperty(
      runtime,
      "modules",
      expoModulesObject
    );
}

jni::local_ref<JavaScriptModuleObject::javaobject>
JSIContext::callGetJavaScriptModuleObjectMethod(const std::string &moduleName) const {
  if (javaPart_ == nullptr) {
    throw std::runtime_error(
      "getJavaScriptModuleObject: JSIContext was prepared to be deallocated.");
  }

  const static auto method = expo::JSIContext::javaClassLocal()
    ->getMethod<jni::local_ref<JavaScriptModuleObject::javaobject>(
      std::string)>(
      "getJavaScriptModuleObject"
    );

  auto jniString = jni::make_jstring(moduleName);
  auto result = jni::Environment::current()->CallObjectMethod(javaPart_.get(), method.getId(), jniString.get());
  throwPendingJniExceptionAsCppException();
  return jni::adopt_local(static_cast<JavaScriptModuleObject::javaobject>(result));
}

jni::local_ref<JavaScriptModuleObject::javaobject>
JSIContext::callGetCoreModuleObject() const {
  if (javaPart_ == nullptr) {
    throw std::runtime_error("getCoreModule: JSIContext was prepared to be deallocated.");
  }

  const static auto method = expo::JSIContext::javaClassLocal()
    ->getMethod<jni::local_ref<JavaScriptModuleObject::javaobject>()>(
      "getCoreModuleObject"
    );
  return method(javaPart_);
}

jni::local_ref<jni::JArrayClass<jni::JString>>
JSIContext::callGetJavaScriptModulesNames() const {
  if (javaPart_ == nullptr) {
    throw std::runtime_error("getJavaScriptModules: JSIContext was prepared to be deallocated.");
  }

  const static auto method = expo::JSIContext::javaClassLocal()
    ->getMethod<jni::local_ref<jni::JArrayClass<jni::JString>>()>(
      "getJavaScriptModulesName"
    );

  auto result = jni::Environment::current()->CallObjectMethod(javaPart_.get(), method.getId());
  throwPendingJniExceptionAsCppException();
  return jni::adopt_local(static_cast<jni::JniType<jni::JArrayClass<jni::JString>>>(result));
}

bool JSIContext::callHasModule(const std::string &moduleName) const {
  if (javaPart_ == nullptr) {
    throw std::runtime_error("hasModule: JSIContext was prepared to be deallocated.");
  }

  const static auto method = expo::JSIContext::javaClassLocal()
    ->getMethod<jboolean(std::string)>(
      "hasModule"
    );
  auto jniString = jni::make_jstring(moduleName);
  auto result = jni::Environment::current()->CallBooleanMethod(javaPart_.get(), method.getId(), jniString.get());
  throwPendingJniExceptionAsCppException();
  return static_cast<bool>(result);
}

jni::local_ref<JavaScriptModuleObject::javaobject>
JSIContext::getModule(const std::string &moduleName) const {
  return callGetJavaScriptModuleObjectMethod(moduleName);
}

jni::local_ref<JavaScriptModuleObject::javaobject> JSIContext::getCoreModule() const {
  return callGetCoreModuleObject();
}

bool JSIContext::hasModule(const std::string &moduleName) const {
  return callHasModule(moduleName);
}

jni::local_ref<jni::JArrayClass<jni::JString>> JSIContext::getModulesName() const {
  return callGetJavaScriptModulesNames();
}

jni::local_ref<JavaScriptValue::javaobject> JSIContext::evaluateScript(
  jni::JString script
) {
  return runtimeHolder->evaluateScript(script.toStdString());
}

void JSIContext::evaluateVoidScript(
  jni::JString script
) {
  runtimeHolder->evaluateVoidScript(script.toStdString());
}

jni::local_ref<JavaScriptObject::javaobject> JSIContext::global() noexcept {
  return runtimeHolder->global();
}

jni::local_ref<JavaScriptObject::javaobject> JSIContext::createObject() noexcept {
  return runtimeHolder->createObject();
}

void JSIContext::drainJSEventLoop() {
  runtimeHolder->drainJSEventLoop();
}

void JSIContext::registerSharedObject(
  jni::local_ref<jobject> native,
  jni::local_ref<JavaScriptObject::javaobject> js
) {
  if (javaPart_ == nullptr) {
    throw std::runtime_error("registerSharedObject: JSIContext was prepared to be deallocated.");
  }

  const static auto method = expo::JSIContext::javaClassLocal()
    ->getMethod<void(jni::local_ref<jobject>, jni::local_ref<JavaScriptObject::javaobject>)>(
      "registerSharedObject"
    );
  method(javaPart_, std::move(native), std::move(js));
}

jni::local_ref<JavaScriptObject::javaobject> JSIContext::getSharedObject(
  int objectId
) {
  if (javaPart_ == nullptr) {
    throw std::runtime_error("getSharedObject: JSIContext was prepared to be deallocated.");
  }

  const static auto method = expo::JSIContext::javaClassLocal()
    ->getMethod<jni::local_ref<JavaScriptObject::javaobject>(int)>(
      "getSharedObject"
    );

  return method(javaPart_, objectId);
}

void JSIContext::deleteSharedObject(
  jni::alias_ref<JSIContext::javaobject> javaObject,
  int objectId
) {
  if (javaObject == nullptr) {
    throw std::runtime_error("deleteSharedObject: JSIContext is invalid.");
  }

  const static auto method = expo::JSIContext::javaClassLocal()
    ->getMethod<void(int)>(
      "deleteSharedObject"
    );
  method(javaObject, objectId);
}

void JSIContext::registerClass(
  jni::local_ref<jclass> native,
  jni::local_ref<JavaScriptObject::javaobject> jsClass
) {
  if (javaPart_ == nullptr) {
    throw std::runtime_error("registerClass: JSIContext was prepared to be deallocated.");
  }

  const static auto method = expo::JSIContext::javaClassLocal()
    ->getMethod<void(jni::local_ref<jclass>, jni::local_ref<JavaScriptObject::javaobject>)>(
      "registerClass"
    );
  method(javaPart_, std::move(native), std::move(jsClass));
}

jni::local_ref<JavaScriptObject::javaobject> JSIContext::getJavascriptClass(
  jni::local_ref<jclass> native
) {
  if (javaPart_ == nullptr) {
    throw std::runtime_error("getJavascriptClass: JSIContext was prepared to be deallocated.");
  }

  const static auto method = expo::JSIContext::javaClassLocal()
    ->getMethod<jni::local_ref<JavaScriptObject::javaobject>(jni::local_ref<jclass>)>(
      "getJavascriptClass"
    );
  return method(javaPart_, std::move(native));
}

void JSIContext::prepareForDeallocation() noexcept {
  jsRegistry.reset();
  if (runtimeHolder) {
    unbindJSIContext(runtimeHolder->get());
    runtimeHolder.reset();
  }
  jniDeallocator.reset();
  wasDeallocated_ = true;
}

void JSIContext::jniSetNativeStateForSharedObject(
  int id,
  jni::alias_ref<JavaScriptObject::javaobject> jsObject
) noexcept {
  auto nativeState = std::make_shared<expo::SharedObject::NativeState>(
    id,
    // We can't predict the order of deallocation of the JSIContext and the SharedObject.
    // So we need to pass a new ref to retain the JSIContext to make sure it's not deallocated before the SharedObject.
    [threadSafeRef = threadSafeJThis](const SharedObject::ObjectId objectId) {
      threadSafeRef->use([objectId](jni::alias_ref<JSIContext::javaobject> globalRef) {
        JSIContext::deleteSharedObject(globalRef, objectId);
      });
    }
  );

  jsObject
    ->cthis()
    ->get()
    ->setNativeState(runtimeHolder->get(), std::move(nativeState));
}

bool JSIContext::wasDeallocated() const noexcept {
  return wasDeallocated_;
}

thread_local std::unordered_map<uintptr_t, JSIContext *> jsiContexts;

void bindJSIContext(const jsi::Runtime &runtime, JSIContext *jsiContext) {
  jsiContexts[reinterpret_cast<uintptr_t>(&runtime)] = jsiContext;
}

void unbindJSIContext(const jsi::Runtime &runtime) {
  jsiContexts.erase(reinterpret_cast<uintptr_t>(&runtime));
}

} // namespace expo
