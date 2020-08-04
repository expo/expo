/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <ABI38_0_0ReactCommon/ABI38_0_0CallInvoker.h>
#include <ABI38_0_0cxxreact/ABI38_0_0MessageQueueThread.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

/**
 * Used to schedule async calls on the NativeModuels thread.
 */
class MessageQueueThreadCallInvoker : public CallInvoker {
 public:
  MessageQueueThreadCallInvoker(
      std::shared_ptr<MessageQueueThread> moduleMessageQueue);

  void invokeAsync(std::function<void()> &&func) override;
  // TODO: add sync support

 private:
  std::shared_ptr<MessageQueueThread> moduleMessageQueue_;
};

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
