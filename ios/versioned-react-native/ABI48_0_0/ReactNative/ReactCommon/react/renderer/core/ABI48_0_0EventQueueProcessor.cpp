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

EventQueueProcessor::EventQueueProcessor(
    EventPipe eventPipe,
    StatePipe statePipe)
    : eventPipe_(std::move(eventPipe)), statePipe_(std::move(statePipe)) {}

void EventQueueProcessor::flushEvents(
    jsi::Runtime &runtime,
    std::vector<RawEvent> &&events) const {
  {
    std::lock_guard<std::mutex> lock(EventEmitter::DispatchMutex());

    for (const auto &event : events) {
      if (event.eventTarget) {
        event.eventTarget->retain(runtime);
      }
    }
  }

  for (auto const &event : events) {
    if (event.category == RawEvent::Category::ContinuousEnd) {
      hasContinuousEventStarted_ = false;
    }

    auto ABI48_0_0ReactPriority = hasContinuousEventStarted_
        ? ABI48_0_0ReactEventPriority::Default
        : ABI48_0_0ReactEventPriority::Discrete;

    if (event.category == RawEvent::Category::Continuous) {
      ABI48_0_0ReactPriority = ABI48_0_0ReactEventPriority::Default;
    }

    if (event.category == RawEvent::Category::Discrete) {
      ABI48_0_0ReactPriority = ABI48_0_0ReactEventPriority::Discrete;
    }

    eventPipe_(
        runtime,
        event.eventTarget.get(),
        event.type,
        ABI48_0_0ReactPriority,
        event.payloadFactory);

    if (event.category == RawEvent::Category::ContinuousStart) {
      hasContinuousEventStarted_ = true;
    }
  }

  // No need to lock `EventEmitter::DispatchMutex()` here.
  // The mutex protects from a situation when the `instanceHandle` can be
  // deallocated during accessing, but that's impossible at this point because
  // we have a strong pointer to it.
  for (const auto &event : events) {
    if (event.eventTarget) {
      event.eventTarget->release(runtime);
    }
  }
}

void EventQueueProcessor::flushStateUpdates(
    std::vector<StateUpdate> &&states) const {
  for (const auto &stateUpdate : states) {
    statePipe_(stateUpdate);
  }
}

} // namespace ABI48_0_0facebook::ABI48_0_0React
