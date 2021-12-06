/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI44_0_0RCTJSIExecutorRuntimeInstaller.h"

#import <ABI44_0_0React/ABI44_0_0RCTLog.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

JSIExecutor::RuntimeInstaller ABI44_0_0RCTJSIExecutorRuntimeInstaller(JSIExecutor::RuntimeInstaller runtimeInstallerToWrap)
{
  return [runtimeInstaller = runtimeInstallerToWrap](jsi::Runtime &runtime) {
    Logger iosLoggingBinder = [](const std::string &message, unsigned int logLevel) {
      _ABI44_0_0RCTLogJavaScriptInternal(static_cast<ABI44_0_0RCTLogLevel>(logLevel), [NSString stringWithUTF8String:message.c_str()]);
    };
    bindNativeLogger(runtime, iosLoggingBinder);

    PerformanceNow iosPerformanceNowBinder = []() {
      // CACurrentMediaTime() returns the current absolute time, in seconds
      return CACurrentMediaTime() * 1000;
    };
    bindNativePerformanceNow(runtime, iosPerformanceNowBinder);

    // Wrap over the original runtimeInstaller
    if (runtimeInstaller) {
      runtimeInstaller(runtime);
    }
  };
}

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
