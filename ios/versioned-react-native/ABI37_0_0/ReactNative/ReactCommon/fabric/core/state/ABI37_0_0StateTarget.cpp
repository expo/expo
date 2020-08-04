/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0StateTarget.h"
#include <ABI37_0_0React/core/ShadowNode.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

StateTarget::StateTarget() : shadowNode_(nullptr) {}

StateTarget::StateTarget(const ShadowNode &shadowNode)
    : shadowNode_(shadowNode.shared_from_this()) {}

StateTarget::operator bool() const {
  return (bool)shadowNode_;
}

const ShadowNode &StateTarget::getShadowNode() const {
  assert(shadowNode_ && "Stored pointer to a ShadowNode must not be null.");
  return *std::static_pointer_cast<const ShadowNode>(shadowNode_);
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
