/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/core/ABI49_0_0BatchedEventQueue.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventBeat.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventListener.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventPriority.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventQueueProcessor.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0StateUpdate.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0UnbatchedEventQueue.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

struct RawEvent;

/*
 * Represents event-delivery infrastructure.
 * Particular `EventEmitter` clases use this for sending events.
 */
class EventDispatcher {
 public:
  using Shared = std::shared_ptr<EventDispatcher const>;
  using Weak = std::weak_ptr<EventDispatcher const>;

  EventDispatcher(
      EventQueueProcessor const &eventProcessor,
      EventBeat::Factory const &synchonousEventBeatFactory,
      EventBeat::Factory const &asynchronousEventBeatFactory,
      EventBeat::SharedOwnerBox const &ownerBox);

  /*
   * Dispatches a raw event with given priority using event-delivery pipe.
   */
  void dispatchEvent(RawEvent &&rawEvent, EventPriority priority) const;

  /*
   * Dispatches a raw event with asynchronous batched priority. Before the
   * dispatch we make sure that no other RawEvent of same type and same target
   * is on the queue.
   */
  void dispatchUniqueEvent(RawEvent &&rawEvent) const;

  /*
   * Dispatches a state update with given priority.
   */
  void dispatchStateUpdate(StateUpdate &&stateUpdate, EventPriority priority)
      const;

#pragma mark - Event listeners
  /*
   * Adds provided event listener to the event dispatcher.
   */
  void addListener(const std::shared_ptr<EventListener const> &listener) const;

  /*
   * Removes provided event listener to the event dispatcher.
   */
  void removeListener(
      const std::shared_ptr<EventListener const> &listener) const;

 private:
  EventQueue const &getEventQueue(EventPriority priority) const;

  std::unique_ptr<UnbatchedEventQueue> synchronousUnbatchedQueue_;
  std::unique_ptr<BatchedEventQueue> synchronousBatchedQueue_;
  std::unique_ptr<UnbatchedEventQueue> asynchronousUnbatchedQueue_;
  std::unique_ptr<BatchedEventQueue> asynchronousBatchedQueue_;

  mutable EventListenerContainer eventListeners_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
