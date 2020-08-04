/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI38_0_0StateTarget.h"
#include <ABI38_0_0React/core/ShadowNode.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

StateTarget::StateTarget() : shadowNode_(nullptr) {}

StateTarget::StateTarget(std::shared_ptr<ShadowNode const> shadowNode)
    : shadowNode_(shadowNode) {}

StateTarget::operator bool() const {
  return (bool)shadowNode_;
}

const ShadowNode &StateTarget::getShadowNode() const {
  assert(shadowNode_ && "Stored pointer to a ShadowNode must not be null.");
  return *shadowNode_;
}

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
