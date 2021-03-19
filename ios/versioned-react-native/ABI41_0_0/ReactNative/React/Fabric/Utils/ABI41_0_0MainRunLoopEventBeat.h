/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <CoreFoundation/CFRunLoop.h>
#include <CoreFoundation/CoreFoundation.h>
#include <ABI41_0_0React/core/EventBeat.h>
#include <ABI41_0_0React/utils/RuntimeExecutor.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

/*
 * Event beat associated with main run loop cycle.
 * The callback is always called on the main thread.
 */
class MainRunLoopEventBeat final : public EventBeat {
 public:
  MainRunLoopEventBeat(
      EventBeat::SharedOwnerBox const &ownerBox,
      RuntimeExecutor runtimeExecutor);
  ~MainRunLoopEventBeat();

  void induce() const override;

 private:
  void lockExecutorAndBeat() const;

  const RuntimeExecutor runtimeExecutor_;
  CFRunLoopObserverRef mainRunLoopObserver_;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
