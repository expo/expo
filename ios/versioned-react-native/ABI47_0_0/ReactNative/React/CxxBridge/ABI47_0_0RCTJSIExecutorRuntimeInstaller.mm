/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0RCTJSIExecutorRuntimeInstaller.h"

#import <ABI47_0_0React/ABI47_0_0RCTLog.h>
#include <chrono>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

JSIExecutor::RuntimeInstaller ABI47_0_0RCTJSIExecutorRuntimeInstaller(JSIExecutor::RuntimeInstaller runtimeInstallerToWrap)
{
  return [runtimeInstaller = runtimeInstallerToWrap](jsi::Runtime &runtime) {
    Logger iosLoggingBinder = [](const std::string &message, unsigned int logLevel) {
      _ABI47_0_0RCTLogJavaScriptInternal(static_cast<ABI47_0_0RCTLogLevel>(logLevel), [NSString stringWithUTF8String:message.c_str()]);
    };
    bindNativeLogger(runtime, iosLoggingBinder);

    PerformanceNow iosPerformanceNowBinder = []() {
      auto time = std::chrono::steady_clock::now();
      auto duration = std::chrono::duration_cast<std::chrono::nanoseconds>(time.time_since_epoch()).count();

      constexpr double NANOSECONDS_IN_MILLISECOND = 1000000.0;

      return duration / NANOSECONDS_IN_MILLISECOND;
    };
    bindNativePerformanceNow(runtime, iosPerformanceNowBinder);

    // Wrap over the original runtimeInstaller
    if (runtimeInstaller) {
      runtimeInstaller(runtime);
    }
  };
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
