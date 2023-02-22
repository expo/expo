#import <Foundation/Foundation.h>
#import <ABI48_0_0RNReanimated/NativeProxy.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REAEventDispatcher.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REAModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridge+Private.h>
#import <ABI48_0_0React/ABI48_0_0RCTCxxBridgeDelegate.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0RCTTurboModuleManager.h>
#import <jsireact/JSIExecutor.h>

#if REACT_NATIVE_MINOR_VERSION >= 64
#import <ABI48_0_0React/ABI48_0_0RCTJSIExecutorRuntimeInstaller.h>
#endif

#if REACT_NATIVE_MINOR_VERSION < 63
#import <ABI48_0_0ReactCommon/ABI48_0_0BridgeJSCallInvoker.h>
#endif

NS_ASSUME_NONNULL_BEGIN

namespace ABI48_0_0reanimated {

using namespace ABI48_0_0facebook;
using namespace ABI48_0_0React;

JSIExecutor::RuntimeInstaller ABI48_0_0REAJSIExecutorRuntimeInstaller(
    ABI48_0_0RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);

} // namespace reanimated
NS_ASSUME_NONNULL_END
