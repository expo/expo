#import "DevMenuREAInitializer.h"
#import "DevMenuREAUIManager.h"
#import "DevMenuREAEventDispatcher.h"

@interface RCTEventDispatcher (DevMenuReanimated)

- (void)setBridge:(RCTBridge *)bridge;

@end

namespace devmenureanimated {

using namespace facebook;
using namespace react;

JSIExecutor::RuntimeInstaller DevMenuREAJSIExecutorRuntimeInstaller(
    RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap)
{
  [bridge moduleForClass:[RCTUIManager class]];
  DevMenuREAUIManager *reaUiManager = [DevMenuREAUIManager new];
  [reaUiManager setBridge:bridge];
  RCTUIManager *uiManager = reaUiManager;
  [bridge updateModuleWithInstance:uiManager];

  // The creation of the DevMenuREAEventDispatcher was moved to the DevMenuVendoredModulesUtils.vendoredModules
  // because it has to be set up before creating the gesture handler module.
  RCTEventDispatcher *eventDispatcher = bridge.eventDispatcher;
  
  [[bridge moduleForClass:[DevMenuREAModule class]] setUpUiManager:bridge];
#if RNVERSION >= 66
  RCTCallableJSModules *callableJSModules = [RCTCallableJSModules new];
  [bridge setValue:callableJSModules forKey:@"_callableJSModules"];
  [callableJSModules setBridge:bridge];
  [eventDispatcher setValue:callableJSModules forKey:@"_callableJSModules"];
  [eventDispatcher setValue:bridge forKey:@"_bridge"];
  [eventDispatcher initialize];
#else
  [eventDispatcher setBridge:bridge];
#endif
  [bridge updateModuleWithInstance:eventDispatcher];
  const auto runtimeInstaller = [bridge, runtimeInstallerToWrap](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
#if RNVERSION >= 63
    auto reanimatedModule = devmenureanimated::createDevMenuReanimatedModule(bridge, bridge.jsCallInvoker);
#else
    auto callInvoker = std::make_shared<react::BridgeJSCallInvoker>(bridge.reactInstance);
    auto reanimatedModule = devmenureanimated::createDevMenuReanimatedModule(bridge, callInvoker);
#endif
    auto workletRuntimeValue = runtime.global()
                                   .getProperty(runtime, "ArrayBuffer")
                                   .asObject(runtime)
                                   .asFunction(runtime)
                                   .callAsConstructor(runtime, {static_cast<double>(sizeof(void *))});
    uintptr_t *workletRuntimeData =
        reinterpret_cast<uintptr_t *>(workletRuntimeValue.getObject(runtime).getArrayBuffer(runtime).data(runtime));
    workletRuntimeData[0] = reinterpret_cast<uintptr_t>(reanimatedModule->runtime.get());

    runtime.global().setProperty(runtime, "_WORKLET_RUNTIME", workletRuntimeValue);

    runtime.global().setProperty(
        runtime,
        jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
        jsi::Object::createFromHostObject(runtime, reanimatedModule));

    if (runtimeInstallerToWrap) {
      runtimeInstallerToWrap(runtime);
    }
  };
  return runtimeInstaller;
}

}
