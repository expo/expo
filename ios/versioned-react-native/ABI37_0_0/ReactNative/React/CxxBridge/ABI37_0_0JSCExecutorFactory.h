/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI37_0_0jsireact/ABI37_0_0JSIExecutor.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class JSCExecutorFactory : public JSExecutorFactory {
public:
  explicit JSCExecutorFactory(
      JSIExecutor::RuntimeInstaller runtimeInstaller)
      : runtimeInstaller_(std::move(runtimeInstaller)) {}

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

private:
  JSIExecutor::RuntimeInstaller runtimeInstaller_;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
