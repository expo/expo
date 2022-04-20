/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0RCTJSIExecutorRuntimeInstaller.h"

#import <ABI45_0_0React/ABI45_0_0RCTLog.h>
#include <chrono>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

JSIExecutor::RuntimeInstaller ABI45_0_0RCTJSIExecutorRuntimeInstaller(JSIExecutor::RuntimeInstaller runtimeInstallerToWrap)
{
  return [runtimeInstaller = runtimeInstallerToWrap](jsi::Runtime &runtime) {
    Logger iosLoggingBinder = [](const std::string &message, unsigned int logLevel) {
      _ABI45_0_0RCTLogJavaScriptInternal(static_cast<ABI45_0_0RCTLogLevel>(logLevel), [NSString stringWithUTF8String:message.c_str()]);
    };
    bindNativeLogger(runtime, iosLoggingBinder);

    PerformanceNow iosPerformanceNowBinder = []() {
      auto time = std::chrono::system_clock::now().time_since_epoch();
      return std::chrono::duration_cast<std::chrono::milliseconds>(time).count();
    };
    bindNativePerformanceNow(runtime, iosPerformanceNowBinder);

    // Wrap over the original runtimeInstaller
    if (runtimeInstaller) {
      runtimeInstaller(runtime);
    }
  };
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
