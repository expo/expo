/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/core/EventQueue.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Event Queue that dispatches events as granular as possible without waiting
 * for the next beat.
 */
class UnbatchedEventQueue final : public EventQueue {
 public:
  using EventQueue::EventQueue;

  void onEnqueue() const override;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
