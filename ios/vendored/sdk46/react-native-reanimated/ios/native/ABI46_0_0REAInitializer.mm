#import <ABI46_0_0RNReanimated/ABI46_0_0REAInitializer.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0REAUIManager.h>

@interface ABI46_0_0RCTEventDispatcher (Reanimated)

- (void)setBridge:(ABI46_0_0RCTBridge *)bridge;

@end

namespace ABI46_0_0reanimated {

using namespace ABI46_0_0facebook;
using namespace ABI46_0_0React;

JSIExecutor::RuntimeInstaller ABI46_0_0REAJSIExecutorRuntimeInstaller(
    ABI46_0_0RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap)
{
  [bridge moduleForClass:[ABI46_0_0RCTUIManager class]];
  ABI46_0_0REAUIManager *reaUiManager = [ABI46_0_0REAUIManager new];
  [reaUiManager setBridge:bridge];
  ABI46_0_0RCTUIManager *uiManager = reaUiManager;
  [bridge updateModuleWithInstance:uiManager];

  [bridge moduleForClass:[ABI46_0_0RCTEventDispatcher class]];
  ABI46_0_0RCTEventDispatcher *eventDispatcher = [ABI46_0_0REAEventDispatcher new];
#if RNVERSION >= 66
  ABI46_0_0RCTCallableJSModules *callableJSModules = [ABI46_0_0RCTCallableJSModules new];
  [bridge setValue:callableJSModules forKey:@"_callableJSModules"];
  [callableJSModules setBridge:bridge];
  [eventDispatcher setValue:callableJSModules forKey:@"_callableJSModules"];
  [eventDispatcher setValue:bridge forKey:@"_bridge"];
  [eventDispatcher initialize];
#else
  [eventDispatcher setBridge:bridge];
#endif
  [bridge updateModuleWithInstance:eventDispatcher];
  const auto runtimeInstaller = [bridge, runtimeInstallerToWrap](ABI46_0_0facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
#if RNVERSION >= 63
    auto reanimatedModule = ABI46_0_0reanimated::createReanimatedModule(bridge, bridge.jsCallInvoker);
#else
    auto callInvoker = std::make_shared<ABI46_0_0React::BridgeJSCallInvoker>(bridge.reactInstance);
    auto reanimatedModule = ABI46_0_0reanimated::createReanimatedModule(bridge, callInvoker);
#endif
    auto workletRuntimeValue = runtime
        .global()
        .getProperty(runtime, "ArrayBuffer")
        .asObject(runtime)
        .asFunction(runtime)
        .callAsConstructor(runtime, {static_cast<double>(sizeof(void*))});
    uintptr_t* workletRuntimeData = reinterpret_cast<uintptr_t*>(
        workletRuntimeValue.getObject(runtime).getArrayBuffer(runtime).data(runtime));
    workletRuntimeData[0] = reinterpret_cast<uintptr_t>(reanimatedModule->runtime.get());

    runtime.global().setProperty(
        runtime,
        "_WORKLET_RUNTIME",
        workletRuntimeValue);

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
