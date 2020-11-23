/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI40_0_0JSCExecutorFactory.h"

#import <ABI40_0_0React/ABI40_0_0RCTLog.h>
#import <ABI40_0_0jsi/ABI40_0_0JSCRuntime.h>

#import <memory>

namespace ABI40_0_0facebook {
namespace ABI40_0_0React {

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> __unused jsQueue)
{
  auto installBindings = [runtimeInstaller = runtimeInstaller_](jsi::Runtime &runtime) {
    ABI40_0_0React::Logger iosLoggingBinder = [](const std::string &message, unsigned int logLevel) {
      _ABI40_0_0RCTLogJavaScriptInternal(static_cast<ABI40_0_0RCTLogLevel>(logLevel), [NSString stringWithUTF8String:message.c_str()]);
    };
    ABI40_0_0React::bindNativeLogger(runtime, iosLoggingBinder);

    ABI40_0_0React::PerformanceNow iosPerformanceNowBinder = []() {
      // CACurrentMediaTime() returns the current absolute time, in seconds
      return CACurrentMediaTime() * 1000;
    };
    ABI40_0_0React::bindNativePerformanceNow(runtime, iosPerformanceNowBinder);

    // Wrap over the original runtimeInstaller
    if (runtimeInstaller) {
      runtimeInstaller(runtime);
    }
  };
  return std::make_unique<JSIExecutor>(
      ABI40_0_0facebook::jsc::makeJSCRuntime(), delegate, JSIExecutor::defaultTimeoutInvoker, std::move(installBindings));
}

} // namespace ABI40_0_0React
} // namespace ABI40_0_0facebook
