#include "WorkletRuntimeInstaller.h"

#if WORKLETS_ENABLED

#include "../worklets/WorkletJSCallInvoker.h"
#include <worklets/WorkletRuntime/WorkletRuntime.h>

#endif

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

void WorkletRuntimeInstaller::registerNatives() {
  javaClassLocal()->registerNatives({
                                      makeNativeMethod("install", WorkletRuntimeInstaller::install)
  });
}

jni::local_ref<JSIContext::javaobject> WorkletRuntimeInstaller::install(
  jni::alias_ref<MainRuntimeInstaller::javaobject> self,
  jni::alias_ref<jni::JWeakReference<jobject>::javaobject> runtimeContextHolder,
  jlong jsRuntimePointer,
  jni::alias_ref<JNIDeallocator::javaobject> jniDeallocator
) noexcept {
#if WORKLETS_ENABLED
  jsi::Runtime* jsRuntime = reinterpret_cast<jsi::Runtime *>(jsRuntimePointer);
  auto workletRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*jsRuntime);

  auto jsiContext = MainRuntimeInstaller::createJSIContext(
    std::move(runtimeContextHolder),
    jsRuntimePointer,
    std::move(jniDeallocator),
    std::make_shared<WorkletJSCallInvoker>(workletRuntime)
  );

  MainRuntimeInstaller::prepareRuntime(jsiContext);

  return jsiContext;
#else
  return nullptr;
#endif
}

} // namespace expo
