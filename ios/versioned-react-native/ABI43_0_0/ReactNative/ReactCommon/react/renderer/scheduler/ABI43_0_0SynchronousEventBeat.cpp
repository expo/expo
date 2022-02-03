/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0SynchronousEventBeat.h"

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

SynchronousEventBeat::SynchronousEventBeat(
    RunLoopObserver::Unique uiRunLoopObserver,
    RuntimeExecutor runtimeExecutor)
    : EventBeat({}),
      uiRunLoopObserver_(std::move(uiRunLoopObserver)),
      runtimeExecutor_(std::move(runtimeExecutor)) {
  uiRunLoopObserver_->setDelegate(this);
  uiRunLoopObserver_->enable();
}

void SynchronousEventBeat::activityDidChange(
    RunLoopObserver::Delegate const *delegate,
    RunLoopObserver::Activity activity) const noexcept {
  assert(delegate == this);
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

  executeSynchronouslyOnSameThread_CAN_DEADLOCK(
      runtimeExecutor_, [this](jsi::Runtime &runtime) { beat(runtime); });
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
