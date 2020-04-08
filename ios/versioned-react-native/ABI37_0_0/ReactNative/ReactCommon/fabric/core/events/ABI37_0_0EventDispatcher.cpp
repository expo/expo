/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0EventDispatcher.h"

#include <ABI37_0_0React/core/StateUpdate.h>

#include "ABI37_0_0BatchedEventQueue.h"
#include "ABI37_0_0RawEvent.h"
#include "ABI37_0_0UnbatchedEventQueue.h"

#define ABI37_0_0REACT_FABRIC_SYNC_EVENT_DISPATCHING_DISABLED

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

EventDispatcher::EventDispatcher(
    const EventPipe &eventPipe,
    const StatePipe &statePipe,
    const EventBeatFactory &synchonousEventBeatFactory,
    const EventBeatFactory &asynchonousEventBeatFactory) {
  // Synchronous/Unbatched
  eventQueues_[(int)EventPriority::SynchronousUnbatched] =
      std::make_unique<UnbatchedEventQueue>(
          eventPipe, statePipe, synchonousEventBeatFactory());

  // Synchronous/Batched
  eventQueues_[(int)EventPriority::SynchronousBatched] =
      std::make_unique<BatchedEventQueue>(
          eventPipe, statePipe, synchonousEventBeatFactory());

  // Asynchronous/Unbatched
  eventQueues_[(int)EventPriority::AsynchronousUnbatched] =
      std::make_unique<UnbatchedEventQueue>(
          eventPipe, statePipe, asynchonousEventBeatFactory());

  // Asynchronous/Batched
  eventQueues_[(int)EventPriority::AsynchronousBatched] =
      std::make_unique<BatchedEventQueue>(
          eventPipe, statePipe, asynchonousEventBeatFactory());
}

void EventDispatcher::dispatchEvent(
    const RawEvent &rawEvent,
    EventPriority priority) const {
  getEventQueue(priority).enqueueEvent(std::move(rawEvent));
}

void EventDispatcher::dispatchStateUpdate(
    StateUpdate &&stateUpdate,
    EventPriority priority) const {
  getEventQueue(priority).enqueueStateUpdate(std::move(stateUpdate));
}

const EventQueue &EventDispatcher::getEventQueue(EventPriority priority) const {
#ifdef ABI37_0_0REACT_FABRIC_SYNC_EVENT_DISPATCHING_DISABLED
  priority = EventPriority::AsynchronousBatched;
#endif

  return *eventQueues_[(int)priority];
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
