/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/animations/ABI49_0_0primitives.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Float.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowViewMutation.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

static inline bool shouldFirstComeBeforeSecondRemovesOnly(
    ShadowViewMutation const &lhs,
    ShadowViewMutation const &rhs) noexcept {
  // Make sure that removes on the same level are sorted - highest indices must
  // come first.
  return (lhs.type == ShadowViewMutation::Type::Remove &&
          lhs.type == rhs.type) &&
      (lhs.parentShadowView.tag == rhs.parentShadowView.tag) &&
      (lhs.index > rhs.index);
}

static inline bool shouldFirstComeBeforeSecondMutation(
    ShadowViewMutation const &lhs,
    ShadowViewMutation const &rhs) noexcept {
  if (lhs.type != rhs.type) {
    // Deletes always come last
    if (lhs.type == ShadowViewMutation::Type::Delete) {
      return false;
    }
    if (rhs.type == ShadowViewMutation::Type::Delete) {
      return true;
    }

    // Remove comes before insert
    if (lhs.type == ShadowViewMutation::Type::Remove &&
        rhs.type == ShadowViewMutation::Type::Insert) {
      return true;
    }
    if (rhs.type == ShadowViewMutation::Type::Remove &&
        lhs.type == ShadowViewMutation::Type::Insert) {
      return false;
    }

    // Create comes before insert
    if (lhs.type == ShadowViewMutation::Type::Create &&
        rhs.type == ShadowViewMutation::Type::Insert) {
      return true;
    }
    if (rhs.type == ShadowViewMutation::Type::Create &&
        lhs.type == ShadowViewMutation::Type::Insert) {
      return false;
    }
  } else {
    // Make sure that removes on the same level are sorted - highest indices
    // must come first.
    if (lhs.type == ShadowViewMutation::Type::Remove &&
        lhs.parentShadowView.tag == rhs.parentShadowView.tag) {
      if (lhs.index > rhs.index) {
        return true;
      } else {
        return false;
      }
    }
  }

  return false;
}

std::pair<Float, Float> calculateAnimationProgress(
    uint64_t now,
    LayoutAnimation const &animation,
    AnimationConfig const &mutationConfig);

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
