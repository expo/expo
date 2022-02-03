#import "REAInitializer.h"

@interface RCTEventDispatcher(Reanimated)

- (void)setBridge:(RCTBridge*)bridge;

@end

namespace devmenureanimated {

using namespace facebook;
using namespace react;

JSIExecutor::RuntimeInstaller REAJSIExecutorRuntimeInstaller(
    RCTBridge* bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap)
{
    [bridge moduleForClass:[RCTEventDispatcher class]];
    RCTEventDispatcher *eventDispatcher = [DevMenuREAEventDispatcher new];
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
    _devmenu_bridge_reanimated = bridge;
    const auto runtimeInstaller = [bridge, runtimeInstallerToWrap](facebook::jsi::Runtime &runtime) {
      if (!bridge) {
        return;
      }
#if RNVERSION >= 63
    auto reanimatedModule = devmenureanimated::createReanimatedModule(bridge.jsCallInvoker);
#else
    auto callInvoker = std::make_shared<react::BridgeJSCallInvoker>(bridge.reactInstance);
    auto reanimatedModule = devmenureanimated::createReanimatedModule(callInvoker);
#endif
    runtime.global().setProperty(runtime,
                                 jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
                                 jsi::Object::createFromHostObject(runtime, reanimatedModule));
        
        if (runtimeInstallerToWrap) {
            runtimeInstallerToWrap(runtime);
        }
    };
    return runtimeInstaller;
}


}
