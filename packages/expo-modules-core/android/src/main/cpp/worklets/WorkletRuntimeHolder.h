#pragma once

#if WORKLETS_ENABLED

#include <worklets/WorkletRuntime/WorkletRuntime.h>

#endif

#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

class WorkletRuntimeHolder : public jni::HybridClass<WorkletRuntimeHolder> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/worklets/WorkletRuntimeHolder;";
  static auto constexpr TAG = "WorkletRuntimeHolder";

  static void registerNatives();

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jobject> jThis, jlong runtimePointer);

  explicit WorkletRuntimeHolder(jlong runtimePointer);

#if WORKLETS_ENABLED
  std::weak_ptr<worklets::WorkletRuntime> workletRuntime;
#endif

private:
  friend HybridBase;
};

} // namespace expo
