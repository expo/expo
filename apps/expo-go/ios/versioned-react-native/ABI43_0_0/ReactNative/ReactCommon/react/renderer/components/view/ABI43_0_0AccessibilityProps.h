/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/view/AccessibilityPrimitives.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/Props.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ABI43_0_0ReactPrimitives.h>
#include <ABI43_0_0React/ABI43_0_0renderer/debug/DebugStringConvertible.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class AccessibilityProps {
 public:
  AccessibilityProps() = default;
  AccessibilityProps(
      AccessibilityProps const &sourceProps,
      RawProps const &rawProps);

#pragma mark - Props

  bool accessible{false};
  AccessibilityTraits accessibilityTraits{AccessibilityTraits::None};
  AccessibilityState accessibilityState;
  std::string accessibilityLabel{""};
  std::string accessibilityHint{""};
  std::vector<std::string> accessibilityActions{};
  bool accessibilityViewIsModal{false};
  bool accessibilityElementsHidden{false};
  bool accessibilityIgnoresInvertColors{false};
  bool onAccessibilityTap{};
  bool onAccessibilityMagicTap{};
  bool onAccessibilityEscape{};
  bool onAccessibilityAction{};
  ImportantForAccessibility importantForAccessibility{
      ImportantForAccessibility::Auto};
  std::string testId{""};

#pragma mark - DebugStringConvertible

#if ABI43_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
