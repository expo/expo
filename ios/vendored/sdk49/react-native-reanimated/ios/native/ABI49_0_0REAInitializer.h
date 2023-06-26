#ifndef ABI49_0_0RCT_NEW_ARCH_ENABLED

#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>

#if ABI49_0_0REACT_NATIVE_MINOR_VERSION <= 71
#import <ABI49_0_0React/ABI49_0_0RCTJSIExecutorRuntimeInstaller.h>
using namespace ABI49_0_0facebook::ABI49_0_0React;
#endif // ABI49_0_0REACT_NATIVE_MINOR_VERSION <= 71

NS_ASSUME_NONNULL_BEGIN

namespace ABI49_0_0reanimated {

void ABI49_0_0REAInitializer(ABI49_0_0RCTBridge *bridge);

#if ABI49_0_0REACT_NATIVE_MINOR_VERSION <= 71
JSIExecutor::RuntimeInstaller ABI49_0_0REAJSIExecutorRuntimeInstaller(
    ABI49_0_0RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);
#endif // ABI49_0_0REACT_NATIVE_MINOR_VERSION <= 71

} // namespace reanimated

NS_ASSUME_NONNULL_END

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
