#pragma once

#include "../ExpoHeader.pch"

#include <worklets/WorkletRuntime/WorkletRuntime.h>

namespace jni = facebook::jni;

namespace expo {

class WorkletNativeRuntime : public jni::HybridClass<WorkletNativeRuntime> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/worklets/WorkletNativeRuntime;";
  static auto constexpr TAG = "WorkletNativeRuntime";

  static void registerNatives();

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jobject> jThis, jlong runtimePointer);

  explicit WorkletNativeRuntime(jlong runtimePointer);

  std::weak_ptr<worklets::WorkletRuntime> workletRuntime;

private:
  friend HybridBase;
};

} // namespace expo
