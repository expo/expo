#ifndef RCT_NEW_ARCH_ENABLED

#import <RNReanimated/REAInitializer.h>

namespace reanimated {

void REAInitializer(RCTBridge *bridge)
{
  // do nothing, just for backward compatibility
}

#if REACT_NATIVE_MINOR_VERSION <= 71

JSIExecutor::RuntimeInstaller REAJSIExecutorRuntimeInstaller(
    RCTBridge *bridge,
    JSIExecutor::RuntimeInstaller runtimeInstallerToWrap)
{
  const auto runtimeInstaller = [runtimeInstallerToWrap](facebook::jsi::Runtime &runtime) {
    if (runtimeInstallerToWrap) {
      runtimeInstallerToWrap(runtime);
    }
  };
  return runtimeInstaller;
}

#endif // REACT_NATIVE_MINOR_VERSION <= 71

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
