/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ReactABI34_0_0/components/view/AccessibilityProps.h>
#include <ReactABI34_0_0/core/ShadowNode.h>

namespace facebook {
namespace ReactABI34_0_0 {

class AccessibleShadowNode;

using SharedAccessibleShadowNode = std::shared_ptr<const AccessibleShadowNode>;

class AccessibleShadowNode {
 public:
#pragma mark - Constructors

  AccessibleShadowNode() = default;

  AccessibleShadowNode(const SharedAccessibilityProps &props);

  AccessibleShadowNode(
      const AccessibleShadowNode &shadowNode,
      const SharedAccessibilityProps &props = nullptr);
};

} // namespace ReactABI34_0_0
} // namespace facebook
