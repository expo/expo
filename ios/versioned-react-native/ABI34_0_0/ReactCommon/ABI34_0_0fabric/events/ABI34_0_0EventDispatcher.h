/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <ReactABI34_0_0/events/EventBeat.h>
#include <ReactABI34_0_0/events/EventQueue.h>
#include <ReactABI34_0_0/events/RawEvent.h>
#include <ReactABI34_0_0/events/primitives.h>

namespace facebook {
namespace ReactABI34_0_0 {

class EventDispatcher;
using SharedEventDispatcher = std::shared_ptr<const EventDispatcher>;
using WeakEventDispatcher = std::weak_ptr<const EventDispatcher>;

/*
 * Represents event-delivery infrastructure.
 * Particular `EventEmitter` clases use this for sending events.
 */
class EventDispatcher {
 public:
  EventDispatcher(
      const EventPipe &eventPipe,
      const EventBeatFactory &synchonousEventBeatFactory,
      const EventBeatFactory &asynchonousEventBeatFactory);

  /*
   * Dispatches a raw event with given priority using event-delivery pipe.
   */
  void dispatchEvent(const RawEvent &rawEvent, EventPriority priority) const;

 private:
  std::array<std::unique_ptr<EventQueue>, 4> eventQueues_;
};

} // namespace ReactABI34_0_0
} // namespace facebook
