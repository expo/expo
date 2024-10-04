/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0EventQueue.h"

#include "ABI48_0_0EventEmitter.h"
#include "ABI48_0_0ShadowNodeFamily.h"

namespace ABI48_0_0facebook::ABI48_0_0React {

EventQueue::EventQueue(
    EventQueueProcessor eventProcessor,
    std::unique_ptr<EventBeat> eventBeat)
    : eventProcessor_(std::move(eventProcessor)),
      eventBeat_(std::move(eventBeat)) {
  eventBeat_->setBeatCallback(
      [this](jsi::Runtime &runtime) { onBeat(runtime); });
}

void EventQueue::enqueueEvent(RawEvent &&rawEvent) const {
  {
    std::lock_guard<std::mutex> lock(queueMutex_);
    eventQueue_.push_back(std::move(rawEvent));
  }

  onEnqueue();
}

void EventQueue::enqueueUniqueEvent(RawEvent &&rawEvent) const {
  {
    std::lock_guard<std::mutex> lock(queueMutex_);

    auto repeatedEvent = eventQueue_.rend();

    for (auto it = eventQueue_.rbegin(); it != eventQueue_.rend(); ++it) {
      if (it->type == rawEvent.type &&
          it->eventTarget == rawEvent.eventTarget) {
        repeatedEvent = it;
        break;
      } else if (it->eventTarget == rawEvent.eventTarget) {
        // It is necessary to maintain order of different event types
        // for the same target. If the same target has event types A1, B1
        // in the event queue and event A2 occurs. A1 has to stay in the
        // queue.
        break;
      }
    }

    if (repeatedEvent == eventQueue_.rend()) {
      eventQueue_.push_back(std::move(rawEvent));
    } else {
      *repeatedEvent = std::move(rawEvent);
    }
  }

  onEnqueue();
}

void EventQueue::enqueueStateUpdate(StateUpdate &&stateUpdate) const {
  {
    std::lock_guard<std::mutex> lock(queueMutex_);
    if (!stateUpdateQueue_.empty()) {
      auto const position = stateUpdateQueue_.back();
      if (stateUpdate.family == position.family) {
        stateUpdateQueue_.pop_back();
      }
    }
    stateUpdateQueue_.push_back(std::move(stateUpdate));
  }

  onEnqueue();
}

void EventQueue::onBeat(jsi::Runtime &runtime) const {
  flushStateUpdates();
  flushEvents(runtime);
}

void EventQueue::flushEvents(jsi::Runtime &runtime) const {
  std::vector<RawEvent> queue;

  {
    std::lock_guard<std::mutex> lock(queueMutex_);

    if (eventQueue_.empty()) {
      return;
    }

    queue = std::move(eventQueue_);
    eventQueue_.clear();
  }

  eventProcessor_.flushEvents(runtime, std::move(queue));
}

void EventQueue::flushStateUpdates() const {
  std::vector<StateUpdate> stateUpdateQueue;

  {
    std::lock_guard<std::mutex> lock(queueMutex_);

    if (stateUpdateQueue_.empty()) {
      return;
    }

    stateUpdateQueue = std::move(stateUpdateQueue_);
    stateUpdateQueue_.clear();
  }

  eventProcessor_.flushStateUpdates(std::move(stateUpdateQueue));
}

} // namespace ABI48_0_0facebook::ABI48_0_0React
