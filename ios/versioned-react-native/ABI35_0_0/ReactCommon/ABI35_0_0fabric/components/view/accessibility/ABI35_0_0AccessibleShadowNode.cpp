/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI35_0_0AccessibleShadowNode.h"

#include <memory>

namespace facebook {
namespace ReactABI35_0_0 {

AccessibleShadowNode::AccessibleShadowNode(
    const SharedAccessibilityProps &props) {
  assert(props);
}

AccessibleShadowNode::AccessibleShadowNode(
    const AccessibleShadowNode &shadowNode,
    const SharedAccessibilityProps &props) {}

} // namespace ReactABI35_0_0
} // namespace facebook
