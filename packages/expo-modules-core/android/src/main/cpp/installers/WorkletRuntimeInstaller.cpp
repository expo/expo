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
  auto *jsRuntime = reinterpret_cast<jsi::Runtime *>(jsRuntimePointer);
  auto workletRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*jsRuntime);

  auto jsiContext = MainRuntimeInstaller::createJSIContext(
    runtimeContextHolder,
    jsRuntimePointer,
    jniDeallocator,
    std::make_shared<WorkletJSCallInvoker>(workletRuntime)
  );

  WorkletRuntimeInstaller::prepareRuntime(jsiContext);

  return jsiContext;
#else
  return nullptr;
#endif
}

void WorkletRuntimeInstaller::prepareRuntime(
  jni::local_ref<JSIContext::javaobject> jsiContext
) noexcept {
#if WORKLETS_ENABLED
  auto cxxPart = jsiContext->cthis();
  auto runtimeHolder = cxxPart->runtimeHolder;
  jsi::Runtime &runtime = runtimeHolder->get();

  bindJSIContext(runtime, cxxPart);

  auto mainObject = std::make_shared<jsi::Object>(runtime);

  auto global = runtime.global();
  jsi::Object descriptor = JavaScriptObject::preparePropertyDescriptor(runtime, 1 << 1);
  descriptor.setProperty(runtime, "value", jsi::Value(runtime, *mainObject));
  common::defineProperty(
    runtime,
    &global,
    "expo",
    std::move(descriptor)
  );

  MainRuntimeInstaller::installClasses(
    runtime,
    cxxPart
  );

// TODO(@lukmccall): Re-enable module installation when iOS start supporting exporting native modules
//  MainRuntimeInstaller::installModules(
//    runtime,
//    cxxPart,
//    mainObject
//  );
#endif
}

} // namespace expo
