/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0jsireact/ABI45_0_0JSIExecutor.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

class JSCExecutorFactory : public JSExecutorFactory {
 public:
  explicit JSCExecutorFactory(JSIExecutor::RuntimeInstaller runtimeInstaller)
      : runtimeInstaller_(std::move(runtimeInstaller)) {}

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

 private:
  JSIExecutor::RuntimeInstaller runtimeInstaller_;
};

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
