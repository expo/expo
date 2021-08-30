/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI41_0_0UnbatchedEventQueue.h"

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

void UnbatchedEventQueue::onEnqueue() const {
  EventQueue::onEnqueue();

  eventBeat_->request();
  eventBeat_->induce();
}

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
