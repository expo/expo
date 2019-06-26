/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI33_0_0JSCExecutorFactory.h"

#import <ReactABI33_0_0/ABI33_0_0RCTLog.h>
#import <ABI33_0_0jsi/ABI33_0_0JSCRuntime.h>

namespace facebook {
namespace ReactABI33_0_0 {

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(
  std::shared_ptr<ExecutorDelegate> delegate,
  std::shared_ptr<MessageQueueThread> jsQueue) {
  return folly::make_unique<JSIExecutor>(
    facebook::jsc::makeJSCRuntime(),
    delegate,
    [](const std::string &message, unsigned int logLevel) {
      _ABI33_0_0RCTLogJavaScriptInternal(
        static_cast<ABI33_0_0RCTLogLevel>(logLevel),
        [NSString stringWithUTF8String:message.c_str()]);
    },
    JSIExecutor::defaultTimeoutInvoker,
    std::move(runtimeInstaller_));
}

} // namespace ReactABI33_0_0
} // namespace facebook
