/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <vector>

#include <ABI43_0_0jsi/ABI43_0_0jsi.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/EventBeat.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/EventPipe.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/RawEvent.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/StatePipe.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/StateUpdate.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * Event Queue synchronized with given Event Beat and dispatching event
 * using given Event Pipe.
 */
class EventQueue {
 public:
  EventQueue(
      EventPipe eventPipe,
      StatePipe statePipe,
      std::unique_ptr<EventBeat> eventBeat);
  virtual ~EventQueue() = default;

  /*
   * Enqueues and (probably later) dispatch a given event.
   * Can be called on any thread.
   */
  void enqueueEvent(const RawEvent &rawEvent) const;

  /*
   * Enqueues and (probably later) dispatch a given state update.
   * Can be called on any thread.
   */
  void enqueueStateUpdate(const StateUpdate &stateUpdate) const;

 protected:
  /*
   * Called on any enqueue operation.
   * Override in subclasses to trigger beat `request` and/or beat `induce`.
   * Default implementation does nothing.
   */
  virtual void onEnqueue() const;
  void onBeat(jsi::Runtime &runtime) const;

  void flushEvents(jsi::Runtime &runtime) const;
  void flushStateUpdates() const;

  const EventPipe eventPipe_;
  const StatePipe statePipe_;
  const std::unique_ptr<EventBeat> eventBeat_;
  // Thread-safe, protected by `queueMutex_`.
  mutable std::vector<RawEvent> eventQueue_;
  mutable std::vector<StateUpdate> stateUpdateQueue_;
  mutable std::mutex queueMutex_;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
