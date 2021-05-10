/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/components/view/AccessibilityPrimitives.h>
#include <ABI41_0_0React/core/Props.h>
#include <ABI41_0_0React/core/ABI41_0_0ReactPrimitives.h>
#include <ABI41_0_0React/debug/DebugStringConvertible.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

class AccessibilityProps {
 public:
  AccessibilityProps() = default;
  AccessibilityProps(
      AccessibilityProps const &sourceProps,
      RawProps const &rawProps);

#pragma mark - Props

  bool accessible{false};
  AccessibilityTraits accessibilityTraits{AccessibilityTraits::None};
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
  std::string testId{""};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
