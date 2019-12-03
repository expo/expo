/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/view/AccessibilityPrimitives.h>
#include <ReactABI34_0_0/core/Props.h>
#include <ReactABI34_0_0/core/ReactABI34_0_0Primitives.h>
#include <ReactABI34_0_0/debug/DebugStringConvertible.h>

namespace facebook {
namespace ReactABI34_0_0 {

class AccessibilityProps;

typedef std::shared_ptr<const AccessibilityProps> SharedAccessibilityProps;

class AccessibilityProps : public virtual DebugStringConvertible {
 public:
  AccessibilityProps() = default;
  AccessibilityProps(
      const AccessibilityProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

  const bool accessible{false};
  const AccessibilityTraits accessibilityTraits{AccessibilityTraits::None};
  const std::string accessibilityLabel{""};
  const std::string accessibilityHint{""};
  const std::vector<std::string> accessibilityActions{};
  const bool accessibilityViewIsModal{false};
  const bool accessibilityElementsHidden{false};
  const bool accessibilityIgnoresInvertColors{false};
  const std::string testId{""};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ReactABI34_0_0
} // namespace facebook
