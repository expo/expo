/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0RuntimeSchedulerCallInvoker.h"

#include <utility>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

RuntimeSchedulerCallInvoker::RuntimeSchedulerCallInvoker(
    std::weak_ptr<RuntimeScheduler> runtimeScheduler)
    : runtimeScheduler_(std::move(runtimeScheduler)) {}

void RuntimeSchedulerCallInvoker::invokeAsync(std::function<void()> &&func) {
  if (auto runtimeScheduler = runtimeScheduler_.lock()) {
    runtimeScheduler->scheduleWork(
        [func = std::move(func)](jsi::Runtime &) { func(); });
  }
}

void RuntimeSchedulerCallInvoker::invokeSync(std::function<void()> &&func) {
  if (auto runtimeScheduler = runtimeScheduler_.lock()) {
    runtimeScheduler->executeNowOnTheSameThread(
        [func = std::move(func)](jsi::Runtime &) { func(); });
  }
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
