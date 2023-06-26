/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0ReactCommon/ABI49_0_0RuntimeExecutor.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventBeat.h>
#include <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeScheduler.h>
#include <ABI49_0_0React/utils/ABI49_0_0RunLoopObserver.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * Event beat associated with main run loop.
 * The callback is always called on the main thread.
 */
class SynchronousEventBeat final : public EventBeat,
                                   public RunLoopObserver::Delegate {
 public:
  SynchronousEventBeat(
      RunLoopObserver::Unique uiRunLoopObserver,
      RuntimeExecutor runtimeExecutor,
      std::shared_ptr<RuntimeScheduler> runtimeScheduler);

  void induce() const override;

#pragma mark - RunLoopObserver::Delegate

  void activityDidChange(
      RunLoopObserver::Delegate const *delegate,
      RunLoopObserver::Activity activity) const noexcept override;

 private:
  void lockExecutorAndBeat() const;

  RunLoopObserver::Unique uiRunLoopObserver_;
  RuntimeExecutor runtimeExecutor_;
  std::shared_ptr<RuntimeScheduler> runtimeScheduler_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
