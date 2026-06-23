#pragma once

#include "../ExpoHeader.pch"
#include "../JavaScriptObject.h"
#include "../installers/MainRuntimeInstaller.h"

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

  // Resolves the raw UI `jsi::Runtime *` (as a jlong) from a
  // `react-native-worklets` UI runtime holder. Returns 0 when worklets isn't
  // linked or the holder doesn't wrap a worklet runtime.
  static jlong resolveUIRuntimePointer(
    jni::alias_ref<jni::JClass> clazz,
    jni::alias_ref<JavaScriptObject::javaobject> uiRuntimeHolder
  ) noexcept;
};

} // namespace expo
