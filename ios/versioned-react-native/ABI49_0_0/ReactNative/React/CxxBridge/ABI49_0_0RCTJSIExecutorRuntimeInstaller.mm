/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0RCTJSIExecutorRuntimeInstaller.h"

#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#include <chrono>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

JSIExecutor::RuntimeInstaller ABI49_0_0RCTJSIExecutorRuntimeInstaller(JSIExecutor::RuntimeInstaller runtimeInstallerToWrap)
{
  return [runtimeInstaller = runtimeInstallerToWrap](jsi::Runtime &runtime) {
    Logger iosLoggingBinder = [](const std::string &message, unsigned int logLevel) {
      _ABI49_0_0RCTLogJavaScriptInternal(static_cast<ABI49_0_0RCTLogLevel>(logLevel), [NSString stringWithUTF8String:message.c_str()]);
    };
    bindNativeLogger(runtime, iosLoggingBinder);
    bindNativePerformanceNow(runtime);

    // Wrap over the original runtimeInstaller
    if (runtimeInstaller) {
      runtimeInstaller(runtime);
    }
  };
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
