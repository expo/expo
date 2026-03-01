// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JavaScriptRuntime.h"
#include "JavaScriptModuleObject.h"
#include "JavaScriptValue.h"
#include "JavaScriptObject.h"
#include "JavaReferencesCache.h"
#include "JSReferencesCache.h"
#include "JNIDeallocator.h"
#include "ThreadSafeJNIGlobalRef.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/CallInvoker.h>

#if IS_NEW_ARCHITECTURE_ENABLED

#include <ReactCommon/RuntimeExecutor.h>
#include <react/jni/JRuntimeExecutor.h>

#endif

#include <ReactCommon/NativeMethodCallInvokerHolder.h>

#include <memory>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

/**
 * A JNI wrapper to initialize CPP part of modules and access all data from the module registry.
 */
class JSIContext : public jni::HybridClass<JSIContext> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/JSIContext;";
  static auto constexpr TAG = "JSIContext";

  static void registerNatives();

  static jni::local_ref<JSIContext::javaobject> newJavaInstance(
    jni::local_ref<jni::detail::HybridData> hybridData,
    jni::alias_ref<jni::JWeakReference<jobject>::javaobject> runtimeContextHolder
  );

  JSIContext(
    jlong jsRuntimePointer,
    jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
    std::shared_ptr<react::CallInvoker> callInvoker
  );

  void bindToJavaPart(
    jni::local_ref<JSIContext::javaobject> jThis
  );

  /**
   * Gets a module for a given name. It will throw an exception if the module doesn't exist.
   *
   * @param moduleName
   * @return An instance of `JavaScriptModuleObject`
   */
  [[nodiscard]] jni::local_ref<JavaScriptModuleObject::javaobject> getModule(const std::string &moduleName) const;

  [[nodiscard]] bool hasModule(const std::string &moduleName) const;

  /**
   * Gets names of all available modules.
   */
  [[nodiscard]] jni::local_ref<jni::JArrayClass<jni::JString>> getModulesName() const;

  /**
   * Exposes a `JavaScriptRuntime::evaluateScript` function to Kotlin
   */
  jni::local_ref<JavaScriptValue::javaobject> evaluateScript(jni::JString script);

  void evaluateVoidScript(jni::JString script);

  /**
   * Exposes a `JavaScriptRuntime::global` function to Kotlin
   */
  jni::local_ref<JavaScriptObject::javaobject> global() noexcept;

  /**
   * Exposes a `JavaScriptRuntime::createObject` function to Kotlin
   */
  jni::local_ref<JavaScriptObject::javaobject> createObject() noexcept;

  /**
   * Adds a shared object to the internal registry
   * @param native part of the shared object
   * @param js part of the shared object
   */
  void registerSharedObject(
    jni::local_ref<jobject> native,
    jni::local_ref<JavaScriptObject::javaobject> js
  );

  /**
   * Gets a shared object from the internal registry
   * @param objectId
   * @return
   */
  jni::local_ref<JavaScriptObject::javaobject> getSharedObject(
    int objectId
  );

  static void deleteSharedObject(
    jni::alias_ref<JSIContext::javaobject> javaObject,
    int objectId
  );

  /**
   * Exposes a `JavaScriptRuntime::drainJSEventLoop` function to Kotlin
   */
  void drainJSEventLoop();

  std::shared_ptr<JavaScriptRuntime> runtimeHolder;
  std::unique_ptr<JSReferencesCache> jsRegistry;
  jni::global_ref<JNIDeallocator::javaobject> jniDeallocator;

  void registerClass(jni::local_ref<jclass> native,
                     jni::local_ref<JavaScriptObject::javaobject> jsClass);

  jni::local_ref<JavaScriptObject::javaobject> getJavascriptClass(jni::local_ref<jclass> native);

  void prepareForDeallocation() noexcept;

  [[nodiscard]] bool wasDeallocated() const noexcept;

  /*
   * We store two global references to the Java part of the JSIContext.registerClass
   * However, one is wrapped in additional abstraction to make it thread-safe,
   * which increase the access time. For most operations, we should use the bare reference.
   * Only for operations that are executed on different threads that aren't attached to JVM,
   * we should use the thread-safe reference.
   */
  jni::global_ref<JSIContext::javaobject> javaPart_;
  std::shared_ptr<ThreadSafeJNIGlobalRef<JSIContext::javaobject>> threadSafeJThis;
private:
  friend HybridBase;

  bool wasDeallocated_ = false;

  [[nodiscard]] inline jni::local_ref<JavaScriptModuleObject::javaobject>
  callGetJavaScriptModuleObjectMethod(const std::string &moduleName) const;

  [[nodiscard]] inline jni::local_ref<jni::JArrayClass<jni::JString>> callGetJavaScriptModulesNames() const;

  [[nodiscard]] inline bool callHasModule(const std::string &moduleName) const;

  void prepareJSIContext(
    jlong jsRuntimePointer,
    jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
    std::shared_ptr<react::CallInvoker> callInvoker
  ) noexcept;

  void prepareRuntime() noexcept;

  void jniSetNativeStateForSharedObject(
    int id,
    jni::alias_ref<JavaScriptObject::javaobject> jsObject
  ) noexcept;
};

/**
 * Binds the JSIContext to the runtime.
 * Thread-safe: uses exclusive lock.
 * @param runtime
 * @param jsiContext
 */
void bindJSIContext(const jsi::Runtime &runtime, JSIContext *jsiContext);

/**
 * Unbinds the JSIContext from the runtime.
 * Thread-safe: uses exclusive lock.
 * @param runtime
 */
void unbindJSIContext(const jsi::Runtime &runtime);

/**
 * Gets the JSIContext for the given runtime.
 * Thread-safe: uses exclusive lock.
 * @param runtime
 * @return JSIContext * - it should never be stored when received from this function.
 * @throws std::invalid_argument if the JSIContext for the given runtime doesn't exist.
 */
JSIContext *getJSIContext(const jsi::Runtime &runtime);

} // namespace expo
