#import <Foundation/Foundation.h>
#import <ABI47_0_0RNReanimated/NativeProxy.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAEventDispatcher.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge+Private.h>
#import <ABI47_0_0React/ABI47_0_0RCTCxxBridgeDelegate.h>
#import <ABI47_0_0ReactCommon/ABI47_0_0RCTTurboModuleManager.h>
#import <jsireact/JSIExecutor.h>

#if REACT_NATIVE_MINOR_VERSION >= 64
#import <ABI47_0_0React/ABI47_0_0RCTJSIExecutorRuntimeInstaller.h>
#endif

#if REACT_NATIVE_MINOR_VERSION < 63
#import <ABI47_0_0ReactCommon/ABI47_0_0BridgeJSCallInvoker.h>
#endif

NS_ASSUME_NONNULL_BEGIN

namespace ABI47_0_0reanimated {

using namespace ABI47_0_0facebook;
using namespace ABI47_0_0React;

JSIExecutor::RuntimeInstaller ABI47_0_0REAJSIExecutorRuntimeInstaller(
    ABI47_0_0RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);

} // namespace reanimated
NS_ASSUME_NONNULL_END
