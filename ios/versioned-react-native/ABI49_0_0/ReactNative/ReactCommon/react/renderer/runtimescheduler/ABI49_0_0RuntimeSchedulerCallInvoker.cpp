/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0RuntimeSchedulerCallInvoker.h"

#include <utility>
#include "ABI49_0_0RuntimeScheduler.h"

namespace ABI49_0_0facebook::ABI49_0_0React {

RuntimeSchedulerCallInvoker::RuntimeSchedulerCallInvoker(
    std::weak_ptr<RuntimeScheduler> runtimeScheduler)
    : runtimeScheduler_(std::move(runtimeScheduler)) {}

void RuntimeSchedulerCallInvoker::invokeAsync(CallFunc &&func) {
  if (auto runtimeScheduler = runtimeScheduler_.lock()) {
    runtimeScheduler->scheduleWork(
        [func = std::move(func)](jsi::Runtime &) { func(); });
  }
}

void RuntimeSchedulerCallInvoker::invokeSync(CallFunc &&func) {
  if (auto runtimeScheduler = runtimeScheduler_.lock()) {
    runtimeScheduler->executeNowOnTheSameThread(
        [func = std::move(func)](jsi::Runtime &) { func(); });
  }
}

void RuntimeSchedulerCallInvoker::invokeAsync(
    SchedulerPriority priority,
    CallFunc &&func) {
  if (auto runtimeScheduler = runtimeScheduler_.lock()) {
    runtimeScheduler->scheduleTask(
        priority, [func = std::move(func)](jsi::Runtime &) { func(); });
  }
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
