/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI31_0_0fabric/ABI31_0_0components/view/AccessibilityProps.h>
#include <ABI31_0_0fabric/ABI31_0_0core/ShadowNode.h>

namespace facebook {
namespace ReactABI31_0_0 {

class AccessibleShadowNode;

using SharedAccessibleShadowNode = std::shared_ptr<const AccessibleShadowNode>;

class AccessibleShadowNode {

public:

#pragma mark - Constructors

  AccessibleShadowNode() = default;

  AccessibleShadowNode(
    const SharedAccessibilityProps &props
  );

  AccessibleShadowNode(
    const AccessibleShadowNode &shadowNode,
    const SharedAccessibilityProps &props = nullptr
  );
};

} // namespace ReactABI31_0_0
} // namespace facebook
