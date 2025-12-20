#include "WorkletNativeRuntime.h"

namespace expo {

void WorkletNativeRuntime::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", WorkletNativeRuntime::initHybrid),
                 });
}

jni::local_ref<WorkletNativeRuntime::jhybriddata> WorkletNativeRuntime::initHybrid(
  jni::alias_ref<jobject> jThis,
  jlong runtimePointer
) {
  return makeCxxInstance(runtimePointer);
}

WorkletNativeRuntime::WorkletNativeRuntime(jlong runtimePointer) {
#if WORKLETS_ENABLED
  auto *jsRuntime = reinterpret_cast<jsi::Runtime *>(runtimePointer);
  workletRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*jsRuntime);
#endif
}

} // namespace expo
