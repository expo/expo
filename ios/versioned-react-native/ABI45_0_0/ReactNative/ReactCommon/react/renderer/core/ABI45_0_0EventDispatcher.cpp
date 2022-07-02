/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0EventDispatcher.h"

#include <ABI45_0_0React/ABI45_0_0renderer/core/StateUpdate.h>

#include "ABI45_0_0BatchedEventQueue.h"
#include "ABI45_0_0RawEvent.h"
#include "ABI45_0_0UnbatchedEventQueue.h"

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

EventDispatcher::EventDispatcher(
    EventQueueProcessor const &eventProcessor,
    EventBeat::Factory const &synchonousEventBeatFactory,
    EventBeat::Factory const &asynchonousEventBeatFactory,
    EventBeat::SharedOwnerBox const &ownerBox)
    : synchronousUnbatchedQueue_(std::make_unique<UnbatchedEventQueue>(
          eventProcessor,
          synchonousEventBeatFactory(ownerBox))),
      synchronousBatchedQueue_(std::make_unique<BatchedEventQueue>(
          eventProcessor,
          synchonousEventBeatFactory(ownerBox))),
      asynchronousUnbatchedQueue_(std::make_unique<UnbatchedEventQueue>(
          eventProcessor,
          asynchonousEventBeatFactory(ownerBox))),
      asynchronousBatchedQueue_(std::make_unique<BatchedEventQueue>(
          eventProcessor,
          asynchonousEventBeatFactory(ownerBox))) {}

void EventDispatcher::dispatchEvent(RawEvent &&rawEvent, EventPriority priority)
    const {
  getEventQueue(priority).enqueueEvent(std::move(rawEvent));
}

void EventDispatcher::dispatchStateUpdate(
    StateUpdate &&stateUpdate,
    EventPriority priority) const {
  getEventQueue(priority).enqueueStateUpdate(std::move(stateUpdate));
}

void EventDispatcher::dispatchUniqueEvent(RawEvent &&rawEvent) const {
  asynchronousBatchedQueue_->enqueueUniqueEvent(std::move(rawEvent));
}

const EventQueue &EventDispatcher::getEventQueue(EventPriority priority) const {
  switch (priority) {
    case EventPriority::SynchronousUnbatched:
      return *synchronousUnbatchedQueue_;
    case EventPriority::SynchronousBatched:
      return *synchronousBatchedQueue_;
    case EventPriority::AsynchronousUnbatched:
      return *asynchronousUnbatchedQueue_;
    case EventPriority::AsynchronousBatched:
      return *asynchronousBatchedQueue_;
  }
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
