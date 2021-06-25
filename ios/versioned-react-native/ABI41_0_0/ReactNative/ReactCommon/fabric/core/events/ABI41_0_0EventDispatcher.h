/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <memory>

#include <ABI41_0_0React/core/EventBeat.h>
#include <ABI41_0_0React/core/EventPipe.h>
#include <ABI41_0_0React/core/EventPriority.h>
#include <ABI41_0_0React/core/EventQueue.h>
#include <ABI41_0_0React/core/StatePipe.h>
#include <ABI41_0_0React/core/StateUpdate.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

class RawEvent;

/*
 * Represents event-delivery infrastructure.
 * Particular `EventEmitter` clases use this for sending events.
 */
class EventDispatcher {
 public:
  using Shared = std::shared_ptr<EventDispatcher const>;
  using Weak = std::weak_ptr<EventDispatcher const>;

  EventDispatcher(
      EventPipe const &eventPipe,
      StatePipe const &statePipe,
      EventBeat::Factory const &synchonousEventBeatFactory,
      EventBeat::Factory const &asynchonousEventBeatFactory,
      EventBeat::SharedOwnerBox const &ownerBox);

  /*
   * Dispatches a raw event with given priority using event-delivery pipe.
   */
  void dispatchEvent(RawEvent const &rawEvent, EventPriority priority) const;

  /*
   * Dispatches a state update with given priority.
   */
  void dispatchStateUpdate(StateUpdate &&stateUpdate, EventPriority priority)
      const;

 private:
  EventQueue const &getEventQueue(EventPriority priority) const;

  std::array<std::unique_ptr<EventQueue>, 4> eventQueues_;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
