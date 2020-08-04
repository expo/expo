/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0BatchedEventQueue.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

void BatchedEventQueue::onEnqueue() const {
  EventQueue::onEnqueue();

  eventBeat_->request();
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
