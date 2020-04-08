/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0StateCoordinator.h"

#include <ABI37_0_0React/core/ShadowNode.h>
#include <ABI37_0_0React/core/StateData.h>
#include <ABI37_0_0React/core/StateUpdate.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

StateCoordinator::StateCoordinator(EventDispatcher::Weak eventDispatcher)
    : eventDispatcher_(eventDispatcher) {}

const StateTarget &StateCoordinator::getTarget() const {
  std::shared_lock<better::shared_mutex> lock(mutex_);
  return target_;
}

void StateCoordinator::setTarget(StateTarget &&target) const {
  std::unique_lock<better::shared_mutex> lock(mutex_);
  target_ = std::move(target);
}

void StateCoordinator::dispatchRawState(
    StateUpdate &&stateUpdate,
    EventPriority priority) const {
  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher || !target_) {
    return;
  }

  eventDispatcher->dispatchStateUpdate(std::move(stateUpdate), priority);
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
