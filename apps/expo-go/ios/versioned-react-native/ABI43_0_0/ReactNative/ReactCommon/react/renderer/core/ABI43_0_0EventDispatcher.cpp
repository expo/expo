/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0EventDispatcher.h"

#include <ABI43_0_0React/ABI43_0_0renderer/core/StateUpdate.h>

#include "ABI43_0_0BatchedEventQueue.h"
#include "ABI43_0_0RawEvent.h"
#include "ABI43_0_0UnbatchedEventQueue.h"

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

EventDispatcher::EventDispatcher(
    EventPipe const &eventPipe,
    StatePipe const &statePipe,
    EventBeat::Factory const &synchonousEventBeatFactory,
    EventBeat::Factory const &asynchonousEventBeatFactory,
    EventBeat::SharedOwnerBox const &ownerBox)
    : synchronousUnbatchedQueue_(std::make_unique<UnbatchedEventQueue>(
          eventPipe,
          statePipe,
          synchonousEventBeatFactory(ownerBox))),
      synchronousBatchedQueue_(std::make_unique<BatchedEventQueue>(
          eventPipe,
          statePipe,
          synchonousEventBeatFactory(ownerBox))),
      asynchronousUnbatchedQueue_(std::make_unique<UnbatchedEventQueue>(
          eventPipe,
          statePipe,
          asynchonousEventBeatFactory(ownerBox))),
      asynchronousBatchedQueue_(std::make_unique<BatchedEventQueue>(
          eventPipe,
          statePipe,
          asynchonousEventBeatFactory(ownerBox))) {}

void EventDispatcher::dispatchEvent(
    RawEvent const &rawEvent,
    EventPriority priority) const {
  getEventQueue(priority).enqueueEvent(std::move(rawEvent));
}

void EventDispatcher::dispatchStateUpdate(
    StateUpdate &&stateUpdate,
    EventPriority priority) const {
  getEventQueue(priority).enqueueStateUpdate(std::move(stateUpdate));
}

void EventDispatcher::dispatchUniqueEvent(RawEvent const &rawEvent) const {
  asynchronousBatchedQueue_->enqueueUniqueEvent(rawEvent);
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

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
