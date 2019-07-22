/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsiReactABI34_0_0/ABI34_0_0JSIExecutor.h>

namespace facebook {
namespace ReactABI34_0_0 {

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

} // namespace ReactABI34_0_0
} // namespace facebook
