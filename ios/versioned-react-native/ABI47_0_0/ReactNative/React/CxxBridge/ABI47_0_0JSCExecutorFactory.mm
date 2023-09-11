/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0JSCExecutorFactory.h"

#import <ABI47_0_0jsi/ABI47_0_0JSCRuntime.h>

#import <memory>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> __unused jsQueue)
{
  return std::make_unique<JSIExecutor>(
      ABI47_0_0facebook::jsc::makeJSCRuntime(), delegate, JSIExecutor::defaultTimeoutInvoker, runtimeInstaller_);
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
