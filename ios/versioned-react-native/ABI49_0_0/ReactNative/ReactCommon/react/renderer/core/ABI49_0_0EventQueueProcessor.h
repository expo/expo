/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventPipe.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0RawEvent.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0StatePipe.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0StateUpdate.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class EventQueueProcessor {
 public:
  EventQueueProcessor(EventPipe eventPipe, StatePipe statePipe);

  void flushEvents(jsi::Runtime &runtime, std::vector<RawEvent> &&events) const;
  void flushStateUpdates(std::vector<StateUpdate> &&states) const;

 private:
  EventPipe const eventPipe_;
  StatePipe const statePipe_;

  mutable bool hasContinuousEventStarted_{false};
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
