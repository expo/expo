#include "Worklet.h"

#if WORKLETS_ENABLED

namespace expo {

void Worklet::registerNatives() {
  javaClassLocal()->registerNatives({
                                      makeNativeMethod("schedule", Worklet::schedule),
                                      makeNativeMethod("execute", Worklet::execute),
                                    });
}

void Worklet::schedule(
  jni::alias_ref<Worklet::javaobject> self,
  jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder,
  jni::alias_ref<Serializable::javaobject> synchronizable
) {
  auto workletRuntime = workletRuntimeHolder->cthis()->workletRuntime.lock();
  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(synchronizable->cthis()->getSerializable());
  workletRuntime->schedule(std::move(worklet));
}

void Worklet::execute(
  jni::alias_ref<Worklet::javaobject> self,
  jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder,
  jni::alias_ref<Serializable::javaobject> synchronizable
) {
  auto workletRuntime = workletRuntimeHolder->cthis()->workletRuntime.lock();
  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(synchronizable->cthis()->getSerializable());

  workletRuntime->runSync(worklet);
}

} // namespace expo

#endif
