#include "WorkletRuntimeHolder.h"

namespace expo {

void WorkletRuntimeHolder::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", WorkletRuntimeHolder::initHybrid),
                 });
}

jni::local_ref<WorkletRuntimeHolder::jhybriddata> WorkletRuntimeHolder::initHybrid(
  jni::alias_ref<jobject> jThis,
  jlong runtimePointer
) {
  return makeCxxInstance(runtimePointer);
}

WorkletRuntimeHolder::WorkletRuntimeHolder(jlong runtimePointer) {
  auto *jsRuntime = reinterpret_cast<jsi::Runtime *>(runtimePointer);
  workletRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*jsRuntime);
}

} // namespace expo
