#import <Foundation/Foundation.h>
#import <ABI45_0_0RNReanimated/NativeProxy.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REAEventDispatcher.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REAModule.h>
#import <ABI45_0_0React/ABI45_0_0RCTBridge+Private.h>
#import <ABI45_0_0React/ABI45_0_0RCTCxxBridgeDelegate.h>
#import <ABI45_0_0ReactCommon/ABI45_0_0RCTTurboModuleManager.h>
#import <jsireact/JSIExecutor.h>

#if RNVERSION >= 64
#import <ABI45_0_0React/ABI45_0_0RCTJSIExecutorRuntimeInstaller.h>
#endif

#if RNVERSION < 63
#import <ABI45_0_0ReactCommon/ABI45_0_0BridgeJSCallInvoker.h>
#endif

NS_ASSUME_NONNULL_BEGIN

namespace ABI45_0_0reanimated {

using namespace ABI45_0_0facebook;
using namespace ABI45_0_0React;

JSIExecutor::RuntimeInstaller ABI45_0_0REAJSIExecutorRuntimeInstaller(
    ABI45_0_0RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);

} // namespace reanimated
NS_ASSUME_NONNULL_END
