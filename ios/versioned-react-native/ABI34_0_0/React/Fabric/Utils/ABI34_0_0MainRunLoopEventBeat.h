// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <CoreFoundation/CFRunLoop.h>
#include <CoreFoundation/CoreFoundation.h>
#include <ReactABI34_0_0/events/EventBeat.h>
#include <ReactABI34_0_0/uimanager/primitives.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Event beat associated with main run loop cycle.
 * The callback is always called on the main thread.
 */
class MainRunLoopEventBeat final : public EventBeat {
 public:
  MainRunLoopEventBeat(RuntimeExecutor runtimeExecutor);
  ~MainRunLoopEventBeat();

  void induce() const override;

 private:
  void lockExecutorAndBeat() const;

  const RuntimeExecutor runtimeExecutor_;
  CFRunLoopObserverRef mainRunLoopObserver_;
};

} // namespace ReactABI34_0_0
} // namespace facebook
