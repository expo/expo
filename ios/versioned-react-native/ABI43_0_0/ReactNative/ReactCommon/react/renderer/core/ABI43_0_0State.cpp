/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0State.h"

#include <ABI43_0_0React/ABI43_0_0renderer/core/ShadowNode.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ShadowNodeFragment.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/State.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/StateData.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

State::State(StateData::Shared const &data, State const &state)
    : family_(state.family_), data_(data), revision_(state.revision_ + 1){};

State::State(
    StateData::Shared const &data,
    ShadowNodeFamily::Shared const &family)
    : family_(family), data_(data), revision_{State::initialRevisionValue} {};

State::Shared State::getMostRecentState() const {
  auto family = family_.lock();
  if (!family) {
    return {};
  }

  return family->getMostRecentState();
}

State::Shared State::getMostRecentStateIfObsolete() const {
  auto family = family_.lock();
  if (!family) {
    return {};
  }

  return family->getMostRecentStateIfObsolete(*this);
}

size_t State::getRevision() const {
  return revision_;
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
