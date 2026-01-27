#pragma once

#include "MainRuntimeInstaller.h"

#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

class WorkletRuntimeInstaller : public jni::JavaClass<WorkletRuntimeInstaller> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/WorkletRuntimeInstaller;";
  static auto constexpr TAG = "WorkletRuntimeInstaller";

  static void registerNatives();

  static jni::local_ref<JSIContext::javaobject> install(
    jni::alias_ref<MainRuntimeInstaller::javaobject> self,
    jni::alias_ref<jni::JWeakReference<jobject>::javaobject> runtimeContextHolder,
    jlong jsRuntimePointer,
    jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator
  ) noexcept;

  static void prepareRuntime(
    jni::local_ref<JSIContext::javaobject> jsiContext
  ) noexcept;
};

} // namespace expo
