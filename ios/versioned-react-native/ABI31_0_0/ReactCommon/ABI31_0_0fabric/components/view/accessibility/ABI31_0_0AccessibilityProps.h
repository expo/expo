/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0components/view/AccessibilityPrimitives.h>
#include <ABI31_0_0fabric/ABI31_0_0core/Props.h>
#include <ABI31_0_0fabric/ABI31_0_0core/ReactABI31_0_0Primitives.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/DebugStringConvertible.h>

namespace facebook {
namespace ReactABI31_0_0 {

class AccessibilityProps;

typedef std::shared_ptr<const AccessibilityProps> SharedAccessibilityProps;

class AccessibilityProps:
  public virtual DebugStringConvertible {

public:

  AccessibilityProps() = default;
  AccessibilityProps(const AccessibilityProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const bool accessible {true};
  const std::vector<std::string> accessibilityActions {};
  const std::string accessibilityLabel {""};
  const AccessibilityTraits accessibilityTraits {AccessibilityTraits::None};
  const bool accessibilityViewIsModal {false};
  const bool accessibilityElementsHidden {false};
};

} // namespace ReactABI31_0_0
} // namespace facebook
