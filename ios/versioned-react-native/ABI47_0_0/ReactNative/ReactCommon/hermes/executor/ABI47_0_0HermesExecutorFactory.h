/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <hermes/ABI47_0_0hermes.h>
#include <ABI47_0_0jsireact/ABI47_0_0JSIExecutor.h>
#include <functional>
#include <utility>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

class HermesExecutorFactory : public JSExecutorFactory {
 public:
  explicit HermesExecutorFactory(
      JSIExecutor::RuntimeInstaller runtimeInstaller,
      const JSIScopedTimeoutInvoker &timeoutInvoker =
          JSIExecutor::defaultTimeoutInvoker,
      ::ABI47_0_0hermes::vm::RuntimeConfig runtimeConfig = defaultRuntimeConfig())
      : runtimeInstaller_(runtimeInstaller),
        timeoutInvoker_(timeoutInvoker),
        runtimeConfig_(std::move(runtimeConfig)) {
    assert(timeoutInvoker_ && "Should not have empty timeoutInvoker");
  }

  void setEnableDebugger(bool enableDebugger);

  void setDebuggerName(const std::string &debuggerName);

  std::unique_ptr<JSExecutor> createJSExecutor(
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue) override;

 private:
  static ::ABI47_0_0hermes::vm::RuntimeConfig defaultRuntimeConfig();

  JSIExecutor::RuntimeInstaller runtimeInstaller_;
  JSIScopedTimeoutInvoker timeoutInvoker_;
  ::ABI47_0_0hermes::vm::RuntimeConfig runtimeConfig_;
  bool enableDebugger_ = true;
  std::string debuggerName_ = "Hermes ABI47_0_0React Native";
};

class HermesExecutor : public JSIExecutor {
 public:
  HermesExecutor(
      std::shared_ptr<jsi::Runtime> runtime,
      std::shared_ptr<ExecutorDelegate> delegate,
      std::shared_ptr<MessageQueueThread> jsQueue,
      const JSIScopedTimeoutInvoker &timeoutInvoker,
      RuntimeInstaller runtimeInstaller);

 private:
  JSIScopedTimeoutInvoker timeoutInvoker_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
