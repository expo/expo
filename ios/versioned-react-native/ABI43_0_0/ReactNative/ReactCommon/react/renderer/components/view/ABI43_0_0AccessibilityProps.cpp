/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0AccessibilityProps.h"

#include <ABI43_0_0React/ABI43_0_0renderer/components/view/accessibilityPropsConversions.h>
#include <ABI43_0_0React/ABI43_0_0renderer/components/view/propsConversions.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/propsConversions.h>
#include <ABI43_0_0React/ABI43_0_0renderer/debug/debugStringConvertibleUtils.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

AccessibilityProps::AccessibilityProps(
    AccessibilityProps const &sourceProps,
    RawProps const &rawProps)
    : accessible(convertRawProp(
          rawProps,
          "accessible",
          sourceProps.accessible,
          false)),
      accessibilityTraits(convertRawProp(
          rawProps,
          "accessibilityRole",
          sourceProps.accessibilityTraits,
          AccessibilityTraits::None)),
      accessibilityState(convertRawProp(
          rawProps,
          "accessibilityState",
          sourceProps.accessibilityState,
          {})),
      accessibilityLabel(convertRawProp(
          rawProps,
          "accessibilityLabel",
          sourceProps.accessibilityLabel,
          "")),
      accessibilityHint(convertRawProp(
          rawProps,
          "accessibilityHint",
          sourceProps.accessibilityHint,
          "")),
      accessibilityActions(convertRawProp(
          rawProps,
          "accessibilityActions",
          sourceProps.accessibilityActions,
          {})),
      accessibilityViewIsModal(convertRawProp(
          rawProps,
          "accessibilityViewIsModal",
          sourceProps.accessibilityViewIsModal,
          false)),
      accessibilityElementsHidden(convertRawProp(
          rawProps,
          "accessibilityElementsHidden",
          sourceProps.accessibilityElementsHidden,
          false)),
      accessibilityIgnoresInvertColors(convertRawProp(
          rawProps,
          "accessibilityIgnoresInvertColors",
          sourceProps.accessibilityIgnoresInvertColors,
          false)),
      onAccessibilityTap(convertRawProp(
          rawProps,
          "onAccessibilityTap",
          sourceProps.onAccessibilityTap,
          {})),
      onAccessibilityMagicTap(convertRawProp(
          rawProps,
          "onAccessibilityMagicTap",
          sourceProps.onAccessibilityMagicTap,
          {})),
      onAccessibilityEscape(convertRawProp(
          rawProps,
          "onAccessibilityEscape",
          sourceProps.onAccessibilityEscape,
          {})),
      onAccessibilityAction(convertRawProp(
          rawProps,
          "onAccessibilityAction",
          sourceProps.onAccessibilityAction,
          {})),
      importantForAccessibility(convertRawProp(
          rawProps,
          "importantForAccessibility",
          sourceProps.importantForAccessibility,
          ImportantForAccessibility::Auto)),
      testId(convertRawProp(rawProps, "testId", sourceProps.testId, "")) {}

#pragma mark - DebugStringConvertible

#if ABI43_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList AccessibilityProps::getDebugProps() const {
  auto const &defaultProps = AccessibilityProps();
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem("testId", testId, defaultProps.testId),
  };
}
#endif // ABI43_0_0RN_DEBUG_STRING_CONVERTIBLE

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
