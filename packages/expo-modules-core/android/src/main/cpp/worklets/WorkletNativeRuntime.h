#pragma once

#if WORKLETS_ENABLED

#include <worklets/WorkletRuntime/WorkletRuntime.h>

#endif

#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

class WorkletNativeRuntime : public jni::HybridClass<WorkletNativeRuntime> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/worklets/WorkletNativeRuntime;";
  static auto constexpr TAG = "WorkletNativeRuntime";

  static void registerNatives();

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jobject> jThis, jlong runtimePointer);

  explicit WorkletNativeRuntime(jlong runtimePointer);

#if WORKLETS_ENABLED
  std::weak_ptr<worklets::WorkletRuntime> workletRuntime;
#endif

private:
  friend HybridBase;
};

} // namespace expo
