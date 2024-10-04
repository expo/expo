/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI44_0_0AsynchronousEventBeat.h"

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

AsynchronousEventBeat::AsynchronousEventBeat(
    RunLoopObserver::Unique uiRunLoopObserver,
    RuntimeExecutor runtimeExecutor)
    : EventBeat({}),
      uiRunLoopObserver_(std::move(uiRunLoopObserver)),
      runtimeExecutor_(std::move(runtimeExecutor)) {
  uiRunLoopObserver_->setDelegate(this);
  uiRunLoopObserver_->enable();
}

void AsynchronousEventBeat::activityDidChange(
    RunLoopObserver::Delegate const *delegate,
    RunLoopObserver::Activity activity) const noexcept {
  assert(delegate == this);
  induce();
}

void AsynchronousEventBeat::induce() const {
  if (!isRequested_) {
    return;
  }

  // Here we know that `this` object exists because the caller has a strong
  // pointer to `owner`. To ensure the object will exist inside
  // `runtimeExecutor_` callback, we need to copy the  pointer there.
  auto weakOwner = uiRunLoopObserver_->getOwner();

  runtimeExecutor_([this, weakOwner](jsi::Runtime &runtime) mutable {
    auto owner = weakOwner.lock();
    if (!owner) {
      return;
    }

    if (!isRequested_) {
      return;
    }

    this->beat(runtime);
  });
}

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
