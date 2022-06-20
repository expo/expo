#import "REAInitializer.h"


#if __has_include("DevMenuRNGestureHandlerModule.h")
#import "DevMenuRNGestureHandlerModule.h"
#endif

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
    // The creation of the DevMenuREAEventDispatcher was moved to the DevMenuVendoredModulesUtils.vendoredModules
    // because it has to be set up before creating the gesture handler module.
    RCTEventDispatcher *eventDispatcher = bridge.eventDispatcher;
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
