/*
  Note: Files REAInitializer.h and REAInitializer.m are deprecated and will
  be removed in future releases. They are currently kept for backward
  compatibility and will be retained for a few upcoming releases.
*/

#ifndef RCT_NEW_ARCH_ENABLED

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

#if REACT_NATIVE_MINOR_VERSION <= 71
#import <React/RCTJSIExecutorRuntimeInstaller.h>
using namespace facebook::react;
#endif // REACT_NATIVE_MINOR_VERSION <= 71

NS_ASSUME_NONNULL_BEGIN

namespace reanimated {

[[deprecated(
    "REAInitializer method is no longer required, you can just remove invocation.")]] void
REAInitializer(RCTBridge *bridge);

#if REACT_NATIVE_MINOR_VERSION <= 71
[[deprecated(
    "REAJSIExecutorRuntimeInstaller method is no longer required, you can just remove invocation.")]] JSIExecutor::
    RuntimeInstaller
    REAJSIExecutorRuntimeInstaller(
        RCTBridge *bridge,
        JSIExecutor::RuntimeInstaller runtimeInstallerToWrap);
#endif // REACT_NATIVE_MINOR_VERSION <= 71

} // namespace reanimated

NS_ASSUME_NONNULL_END

#endif // RCT_NEW_ARCH_ENABLED
