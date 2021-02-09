/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI38_0_0State.h"

#include <glog/logging.h>
#include <ABI38_0_0React/core/ShadowNode.h>
#include <ABI38_0_0React/core/ShadowNodeFragment.h>
#include <ABI38_0_0React/core/State.h>
#include <ABI38_0_0React/core/StateTarget.h>
#include <ABI38_0_0React/core/StateUpdate.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

State::State(State const &state) : stateCoordinator_(state.stateCoordinator_){};

State::State(StateCoordinator::Shared const &stateCoordinator)
    : stateCoordinator_(stateCoordinator){};

void State::commit(std::shared_ptr<ShadowNode const> const &shadowNode) const {
  stateCoordinator_->setTarget(StateTarget{shadowNode});
}

State::Shared State::getMostRecentState() const {
  auto target = stateCoordinator_->getTarget();
  return target ? target.getShadowNode().getState()
                : ShadowNodeFragment::statePlaceholder();
}

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
