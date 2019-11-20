/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI36_0_0JSCExecutorFactory.h"

#import <ABI36_0_0React/ABI36_0_0RCTLog.h>
#import <ABI36_0_0jsi/ABI36_0_0JSCRuntime.h>

namespace ABI36_0_0facebook {
namespace ABI36_0_0React {

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> __unused jsQueue) {
  auto installBindings = [runtimeInstaller=runtimeInstaller_](jsi::Runtime &runtime) {
    ABI36_0_0React::Logger iosLoggingBinder = [](const std::string &message, unsigned int logLevel) {
      _ABI36_0_0RCTLogJavaScriptInternal(
        static_cast<ABI36_0_0RCTLogLevel>(logLevel),
        [NSString stringWithUTF8String:message.c_str()]);
    };
    ABI36_0_0React::bindNativeLogger(runtime, iosLoggingBinder);
    // Wrap over the original runtimeInstaller
    if (runtimeInstaller) {
      runtimeInstaller(runtime);
    }
  };
  return folly::make_unique<JSIExecutor>(
      ABI36_0_0facebook::jsc::makeJSCRuntime(),
      delegate,
      JSIExecutor::defaultTimeoutInvoker,
      std::move(installBindings));
}

} // namespace ABI36_0_0React
} // namespace ABI36_0_0facebook
