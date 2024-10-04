/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0State.h"

#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNodeFragment.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0State.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0StateData.h>

#include <utility>

namespace ABI49_0_0facebook::ABI49_0_0React {

State::State(StateData::Shared data, State const &state)
    : family_(state.family_),
      data_(std::move(data)),
      revision_(state.revision_ + 1){};

State::State(StateData::Shared data, ShadowNodeFamily::Shared const &family)
    : family_(family),
      data_(std::move(data)),
      revision_{State::initialRevisionValue} {};

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

} // namespace ABI49_0_0facebook::ABI49_0_0React
