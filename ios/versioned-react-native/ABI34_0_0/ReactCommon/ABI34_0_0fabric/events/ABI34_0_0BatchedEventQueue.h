/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/events/EventQueue.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Event Queue that dispatches event in batches synchronizing them with
 * an Event Beat.
 */
class BatchedEventQueue final : public EventQueue {
 public:
  using EventQueue::EventQueue;

  void enqueueEvent(const RawEvent &rawEvent) const override;
};

} // namespace ReactABI34_0_0
} // namespace facebook
