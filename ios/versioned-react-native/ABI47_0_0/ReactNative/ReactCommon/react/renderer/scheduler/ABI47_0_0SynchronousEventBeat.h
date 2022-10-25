/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0ReactCommon/ABI47_0_0RuntimeExecutor.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/EventBeat.h>
#include <ABI47_0_0React/ABI47_0_0renderer/runtimescheduler/RuntimeScheduler.h>
#include <ABI47_0_0React/ABI47_0_0utils/RunLoopObserver.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

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

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
