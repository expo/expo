/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/EventPipe.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/RawEvent.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/StatePipe.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/StateUpdate.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

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

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
