/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0SynchronousEventBeat.h"

#include <ABI47_0_0React/ABI47_0_0debug/ABI47_0_0React_native_assert.h>

#include <utility>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

SynchronousEventBeat::SynchronousEventBeat(
    RunLoopObserver::Unique uiRunLoopObserver,
    RuntimeExecutor runtimeExecutor,
    std::shared_ptr<RuntimeScheduler> runtimeScheduler)
    : EventBeat({}),
      uiRunLoopObserver_(std::move(uiRunLoopObserver)),
      runtimeExecutor_(std::move(runtimeExecutor)),
      runtimeScheduler_(std::move(runtimeScheduler)) {
  uiRunLoopObserver_->setDelegate(this);
  uiRunLoopObserver_->enable();
}

void SynchronousEventBeat::activityDidChange(
    RunLoopObserver::Delegate const *delegate,
    RunLoopObserver::Activity activity) const noexcept {
  ABI47_0_0React_native_assert(delegate == this);
  lockExecutorAndBeat();
}

void SynchronousEventBeat::induce() const {
  if (!this->isRequested_) {
    return;
  }

  if (uiRunLoopObserver_->isOnRunLoopThread()) {
    this->lockExecutorAndBeat();
  }
}

void SynchronousEventBeat::lockExecutorAndBeat() const {
  if (!this->isRequested_) {
    return;
  }

  if (runtimeScheduler_) {
    runtimeScheduler_->executeNowOnTheSameThread(
        [this](jsi::Runtime &runtime) { beat(runtime); });
  } else {
    executeSynchronouslyOnSameThread_CAN_DEADLOCK(
        runtimeExecutor_, [this](jsi::Runtime &runtime) { beat(runtime); });
  }
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
