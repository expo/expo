/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/components/view/AccessibilityPrimitives.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/Props.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/PropsParserContext.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ABI47_0_0ReactPrimitives.h>
#include <ABI47_0_0React/ABI47_0_0renderer/debug/DebugStringConvertible.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

class AccessibilityProps {
 public:
  AccessibilityProps() = default;
  AccessibilityProps(
      const PropsParserContext &context,
      AccessibilityProps const &sourceProps,
      RawProps const &rawProps);

  void setProp(
      const PropsParserContext &context,
      RawPropsPropNameHash hash,
      const char *propName,
      RawValue const &value);

  static bool enablePropIteratorSetter;

#pragma mark - Props

  bool accessible{false};
  AccessibilityState accessibilityState;
  std::string accessibilityLabel{""};
  AccessibilityLabelledBy accessibilityLabelledBy{};
  AccessibilityLiveRegion accessibilityLiveRegion{
      AccessibilityLiveRegion::None};
  AccessibilityTraits accessibilityTraits{AccessibilityTraits::None};
  std::string accessibilityRole{""};
  std::string accessibilityHint{""};
  std::string accessibilityLanguage{""};
  AccessibilityValue accessibilityValue;
  std::vector<AccessibilityAction> accessibilityActions{};
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

#if ABI47_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
