/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI33_0_0jsireact/ABI33_0_0JSIExecutor.h>

namespace facebook {
namespace ReactABI33_0_0 {

class ABI33_0_0JSCExecutorFactory : public JSExecutorFactory {
public:
  explicit ABI33_0_0JSCExecutorFactory(
      ABI33_0_0JSIExecutor::RuntimeInstaller runtimeInstaller)
      : runtimeInstaller_(std::move(runtimeInstaller)) {}

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  ABI33_0_0JSIExecutor::RuntimeInstaller runtimeInstaller_;
};

} // namespace ReactABI33_0_0
} // namespace facebook
