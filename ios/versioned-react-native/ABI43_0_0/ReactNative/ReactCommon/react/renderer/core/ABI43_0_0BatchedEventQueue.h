/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/core/EventQueue.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * Event Queue that dispatches event in batches synchronizing them with
 * an Event Beat.
 */
class BatchedEventQueue final : public EventQueue {
 public:
  using EventQueue::EventQueue;

  void onEnqueue() const override;

  /*
   * Enqueues and (probably later) dispatch a given event.
   * Deletes last RawEvent from the queu if it has the same type and target.
   * Can be called on any thread.
   */
  void enqueueUniqueEvent(const RawEvent &rawEvent) const;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
