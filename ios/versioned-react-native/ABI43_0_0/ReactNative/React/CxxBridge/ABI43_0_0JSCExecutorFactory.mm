/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0JSCExecutorFactory.h"

#import <ABI43_0_0jsi/ABI43_0_0JSCRuntime.h>

#import <memory>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> __unused jsQueue)
{
  return std::make_unique<JSIExecutor>(
      ABI43_0_0facebook::jsc::makeJSCRuntime(), delegate, JSIExecutor::defaultTimeoutInvoker, runtimeInstaller_);
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
