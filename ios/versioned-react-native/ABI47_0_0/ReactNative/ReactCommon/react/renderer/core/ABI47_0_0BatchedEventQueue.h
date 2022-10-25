/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/core/EventQueue.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/EventQueueProcessor.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Event Queue that dispatches event in batches synchronizing them with
 * an Event Beat.
 */
class BatchedEventQueue final : public EventQueue {
 public:
  BatchedEventQueue(
      EventQueueProcessor eventProcessor,
      std::unique_ptr<EventBeat> eventBeat);

  void onEnqueue() const override;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
