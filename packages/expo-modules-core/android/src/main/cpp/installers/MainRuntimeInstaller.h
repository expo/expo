#pragma once

#include "../JSIContext.h"
#include <fbjni/fbjni.h>
#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/CallInvoker.h>
#include "SharedObject.h"

#if IS_NEW_ARCHITECTURE_ENABLED

#include <ReactCommon/RuntimeExecutor.h>
#include <react/jni/JRuntimeExecutor.h>

#endif

namespace expo {

class MainRuntimeInstaller : public jni::JavaClass<MainRuntimeInstaller> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/MainRuntimeInstaller;";
  static auto constexpr TAG = "MainRuntimeInstaller";

  static void registerNatives();

  static jni::local_ref<JSIContext::javaobject> installLegacy(
    jni::alias_ref<MainRuntimeInstaller::javaobject> self,
    jni::alias_ref<jni::JWeakReference<jobject>::javaobject> runtimeContextHolder,
    jlong jsRuntimePointer,
    jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
    jni::alias_ref<react::CallInvokerHolder::javaobject> jsInvokerHolder
  ) noexcept;

#if IS_NEW_ARCHITECTURE_ENABLED

  /**
    * Initializes the `ExpoModulesHostObject` and adds it to the global object.
    */
  static jni::local_ref<JSIContext::javaobject> install(
    jni::alias_ref<MainRuntimeInstaller::javaobject> self,
    jni::alias_ref<jni::JWeakReference<jobject>::javaobject> runtimeContextHolder,
    jlong jsRuntimePointer,
    jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
    jni::alias_ref<react::JRuntimeExecutor::javaobject> runtimeExecutor
  ) noexcept;

#endif

  static jni::local_ref<JSIContext::javaobject> createJSIContext(
    jni::alias_ref<jni::JWeakReference<jobject>::javaobject> runtimeContextHolder,
    jlong jsRuntimePointer,
    jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator,
    std::shared_ptr<react::CallInvoker> callInvoker
  ) noexcept;

  static void prepareRuntime(
    jni::local_ref<JSIContext::javaobject> jsiContext
  ) noexcept;

  static void installClasses(
    jsi::Runtime &runtime,
    expo::SharedObject::ObjectReleaser releaser
  ) noexcept;

};

} // namespace expo
