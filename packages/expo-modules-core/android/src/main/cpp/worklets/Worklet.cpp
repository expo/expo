#include "Worklet.h"

#if WORKLETS_ENABLED

namespace expo {

void Worklet::registerNatives() {
  registerHybrid({
                   makeNativeMethod("schedule", Worklet::schedule),
                   makeNativeMethod("execute", Worklet::execute),
                 });
}

jni::local_ref<Worklet::javaobject> Worklet::newInstance(
  JSIContext *jsiContext,
  const std::shared_ptr<worklets::SerializableWorklet> &worklet
) {
  auto expoWorklet = Worklet::newObjectCxxArgs(worklet);
  jsiContext->jniDeallocator->addReference(expoWorklet);
  return expoWorklet;
}

Worklet::Worklet(
  const std::shared_ptr<worklets::SerializableWorklet> &worklet
) : worklet_(worklet) {}

void Worklet::schedule(
  jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder
) {
  auto workletRuntime = workletRuntimeHolder->cthis()->workletRuntime.lock();
  workletRuntime->schedule(worklet_);
}

void Worklet::execute(
  jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder
) {
  auto workletRuntime = workletRuntimeHolder->cthis()->workletRuntime.lock();
  workletRuntime->runSync(worklet_);
}

} // namespace expo

#endif
