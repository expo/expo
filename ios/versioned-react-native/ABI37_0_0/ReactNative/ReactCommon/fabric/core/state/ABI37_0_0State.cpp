/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0State.h"

#include <glog/logging.h>
#include <ABI37_0_0React/core/ShadowNode.h>
#include <ABI37_0_0React/core/ShadowNodeFragment.h>
#include <ABI37_0_0React/core/State.h>
#include <ABI37_0_0React/core/StateTarget.h>
#include <ABI37_0_0React/core/StateUpdate.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

State::State(State const &state) : stateCoordinator_(state.stateCoordinator_){};

State::State(StateCoordinator::Shared const &stateCoordinator)
    : stateCoordinator_(stateCoordinator){};

void State::commit(const ShadowNode &shadowNode) const {
  stateCoordinator_->setTarget(StateTarget{shadowNode});
}

State::Shared State::getCommitedState() const {
  auto target = stateCoordinator_->getTarget();
  return target ? target.getShadowNode().getState()
                : ShadowNodeFragment::statePlaceholder();
}

#ifdef ANDROID
const folly::dynamic State::getDynamic() const {
  LOG(FATAL)
      << "State::getDynamic should never be called (some virtual method of a concrete implementation should be called instead)";
  abort();
  return folly::dynamic::object();
}
void State::updateState(folly::dynamic data) const {
  LOG(FATAL)
      << "State::updateState should never be called (some virtual method of a concrete implementation should be called instead).";
  abort();
}
#endif

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
