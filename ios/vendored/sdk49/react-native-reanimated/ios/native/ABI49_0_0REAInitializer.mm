#ifndef ABI49_0_0RCT_NEW_ARCH_ENABLED

#import <ABI49_0_0RNReanimated/ABI49_0_0REAEventDispatcher.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REAInitializer.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REAUIManager.h>

namespace ABI49_0_0reanimated {

void ABI49_0_0REAInitializer(ABI49_0_0RCTBridge *bridge)
{
  [bridge moduleForClass:[ABI49_0_0RCTUIManager class]];
  ABI49_0_0REAUIManager *reaUiManager = [ABI49_0_0REAUIManager new];
  [reaUiManager setBridge:bridge];
  ABI49_0_0RCTUIManager *uiManager = reaUiManager;
  [bridge updateModuleWithInstance:uiManager];

  [bridge moduleForClass:[ABI49_0_0RCTEventDispatcher class]];
  ABI49_0_0RCTEventDispatcher *eventDispatcher = [ABI49_0_0REAEventDispatcher new];
#if ABI49_0_0REACT_NATIVE_MINOR_VERSION >= 66
  ABI49_0_0RCTCallableJSModules *callableJSModules = [ABI49_0_0RCTCallableJSModules new];
  [bridge setValue:callableJSModules forKey:@"_callableJSModules"];
  [callableJSModules setBridge:bridge];
  [eventDispatcher setValue:callableJSModules forKey:@"_callableJSModules"];
  [eventDispatcher setValue:bridge forKey:@"_bridge"];
  [eventDispatcher initialize];
#else
  [eventDispatcher setBridge:bridge];
#endif
  [bridge updateModuleWithInstance:eventDispatcher];
}

#if ABI49_0_0REACT_NATIVE_MINOR_VERSION <= 71

JSIExecutor::RuntimeInstaller ABI49_0_0REAJSIExecutorRuntimeInstaller(
    ABI49_0_0RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap)
{
  ABI49_0_0REAInitializer(bridge);

  const auto runtimeInstaller = [runtimeInstallerToWrap](ABI49_0_0facebook::jsi::Runtime &runtime) {
    if (runtimeInstallerToWrap) {
      runtimeInstallerToWrap(runtime);
    }
  };
  return runtimeInstaller;
}

#endif // ABI49_0_0REACT_NATIVE_MINOR_VERSION <= 71

} // namespace reanimated

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
