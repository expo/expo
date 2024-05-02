// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSIContext.h"
#include "ExpoModulesHostObject.h"
#include "JavaReferencesCache.h"
#include "JSReferencesCache.h"
#include "SharedObject.h"
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

/*
 * A wrapper for a global reference that can be deallocated on any thread.
 * It should be used with smart pointer. That structure can't be copied or moved.
 */
template <typename T>
class ThreadSafeJNIGlobalRef {
public:
  ThreadSafeJNIGlobalRef(jobject globalRef) : globalRef(globalRef) {}
  ThreadSafeJNIGlobalRef(const ThreadSafeJNIGlobalRef &other) = delete;
  ThreadSafeJNIGlobalRef(ThreadSafeJNIGlobalRef &&other) = delete;
  ThreadSafeJNIGlobalRef &operator=(const ThreadSafeJNIGlobalRef &other) = delete;
  ThreadSafeJNIGlobalRef &operator=(ThreadSafeJNIGlobalRef &&other) = delete;

  void use(std::function<void(jni::alias_ref<T> globalRef)> &&action) {
    if (globalRef == nullptr) {
      throw std::runtime_error("ThreadSafeJNIGlobalRef: globalRef is null");
    }

    jni::ThreadScope::WithClassLoader([this, action = std::move(action)]() {
      jni::alias_ref<jobject> aliasRef = jni::wrap_alias(globalRef);
      jni::alias_ref<T> jsiContextRef = jni::static_ref_cast<T>(aliasRef);
      action(jsiContextRef);
    });
  }

  ~ThreadSafeJNIGlobalRef() {
    if (globalRef != nullptr) {
      jni::ThreadScope::WithClassLoader([this] {
        jni::Environment::current()->DeleteGlobalRef(this->globalRef);
      });
    }
  }

  jobject globalRef;
};

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
                   makeNativeMethod("installJSIForTests",
                                    JSIContext::installJSIForTests),
                   makeNativeMethod("evaluateScript", JSIContext::evaluateScript),
                   makeNativeMethod("global", JSIContext::global),
                   makeNativeMethod("createObject", JSIContext::createObject),
                   makeNativeMethod("drainJSEventLoop", JSIContext::drainJSEventLoop),
                   makeNativeMethod("setNativeStateForSharedObject",
                                    JSIContext::jniSetNativeStateForSharedObject),
                 });
}

JSIContext::JSIContext(jni::alias_ref<jhybridobject> jThis)
  : javaPart_(jni::make_global(jThis)) {}

JSIContext::~JSIContext() {
  unbindJSIContext(runtimeHolder->get());
  // The runtime would be deallocated automatically.
  // However, we need to enforce the order of deallocations.
  // The runtime has to be deallocated before the JNI part.
  runtimeHolder.reset();
}

void JSIContext::installJSI(
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
  jni::alias_ref<react::CallInvokerHolder::javaobject> jsInvokerHolder
) {
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

void JSIContext::installJSIForTests(
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator
) {
#if !UNIT_TEST
  throw std::logic_error("The function is only available when UNIT_TEST is defined.");
#else
  this->jniDeallocator = jni::make_global(jniDeallocator);

  runtimeHolder = std::make_shared<JavaScriptRuntime>();
  jsi::Runtime &jsiRuntime = runtimeHolder->get();

  jsRegistry = std::make_unique<JSReferencesCache>(jsiRuntime);

  prepareRuntime();
#endif // !UNIT_TEST
}

void JSIContext::prepareJSIContext(
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
  std::shared_ptr<react::CallInvoker> callInvoker
) {
  this->jniDeallocator = jni::make_global(jniDeallocator);
  auto runtime = reinterpret_cast<jsi::Runtime *>(jsRuntimePointer);
  jsRegistry = std::make_unique<JSReferencesCache>(*runtime);

  runtimeHolder = std::make_shared<JavaScriptRuntime>(
    runtime,
    std::move(callInvoker)
  );
}

void JSIContext::prepareRuntime() {
  jsi::Runtime &runtime = runtimeHolder->get();

  bindJSIContext(runtime, this);

  runtimeHolder->installMainObject();

  EventEmitter::installClass(runtime);

  auto threadSafeRef = std::make_shared<ThreadSafeJNIGlobalRef<JSIContext::javaobject>>(
    jni::Environment::current()->NewGlobalRef(javaPart_.get())
  );

  SharedObject::installBaseClass(
    runtime,
    // We can't predict the order of deallocation of the JSIContext and the SharedObject.
    // So we need to pass a new ref to retain the JSIContext to make sure it's not deallocated before the SharedObject.
    [threadSafeRef = std::move(threadSafeRef)](const SharedObject::ObjectId objectId) {
      threadSafeRef->use([objectId](jni::alias_ref<JSIContext::javaobject> globalRef) {
        JSIContext::deleteSharedObject(globalRef, objectId);
      });
    }
  );

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

  return method(javaPart_, moduleName);
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
  return method(javaPart_);
}

bool JSIContext::callHasModule(const std::string &moduleName) const {
  if (javaPart_ == nullptr) {
    throw std::runtime_error("hasModule: JSIContext was prepared to be deallocated.");
  }

  const static auto method = expo::JSIContext::javaClassLocal()
    ->getMethod<jboolean(std::string)>(
      "hasModule"
    );
  return (bool) method(javaPart_, moduleName);
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

jni::local_ref<JavaScriptObject::javaobject> JSIContext::global() {
  return runtimeHolder->global();
}

jni::local_ref<JavaScriptObject::javaobject> JSIContext::createObject() {
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

void JSIContext::prepareForDeallocation() {
  jsRegistry.reset();
  runtimeHolder.reset();
  jniDeallocator.reset();
  javaPart_.reset();
  wasDeallocated_ = true;
}

void JSIContext::jniSetNativeStateForSharedObject(
  int id,
  jni::alias_ref<JavaScriptObject::javaobject> jsObject
) {
  auto threadSafeRef = std::make_shared<ThreadSafeJNIGlobalRef<JSIContext::javaobject>>(
    jni::Environment::current()->NewGlobalRef(javaPart_.get())
  );

  auto nativeState = std::make_shared<expo::SharedObject::NativeState>(
    id,
    // We can't predict the order of deallocation of the JSIContext and the SharedObject.
    // So we need to pass a new ref to retain the JSIContext to make sure it's not deallocated before the SharedObject.
    [threadSafeRef = std::move(threadSafeRef)](const SharedObject::ObjectId objectId) {
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

bool JSIContext::wasDeallocated() const {
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
