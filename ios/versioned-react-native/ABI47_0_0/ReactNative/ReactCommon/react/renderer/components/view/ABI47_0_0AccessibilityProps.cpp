/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0AccessibilityProps.h"

#include <ABI47_0_0React/ABI47_0_0renderer/components/view/accessibilityPropsConversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/view/propsConversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/propsConversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/debug/debugStringConvertibleUtils.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

bool AccessibilityProps::enablePropIteratorSetter = false;

AccessibilityProps::AccessibilityProps(
    const PropsParserContext &context,
    AccessibilityProps const &sourceProps,
    RawProps const &rawProps)
    : accessible(
          enablePropIteratorSetter ? sourceProps.accessible
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "accessible",
                                         sourceProps.accessible,
                                         false)),
      accessibilityState(
          enablePropIteratorSetter ? sourceProps.accessibilityState
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "accessibilityState",
                                         sourceProps.accessibilityState,
                                         {})),
      accessibilityLabel(
          enablePropIteratorSetter ? sourceProps.accessibilityLabel
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "accessibilityLabel",
                                         sourceProps.accessibilityLabel,
                                         "")),
      accessibilityLabelledBy(
          enablePropIteratorSetter ? sourceProps.accessibilityLabelledBy
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "accessibilityLabelledBy",
                                         sourceProps.accessibilityLabelledBy,
                                         {})),
      accessibilityLiveRegion(
          enablePropIteratorSetter ? sourceProps.accessibilityLiveRegion
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "accessibilityLiveRegion",
                                         sourceProps.accessibilityLiveRegion,
                                         AccessibilityLiveRegion::None)),
      accessibilityHint(
          enablePropIteratorSetter ? sourceProps.accessibilityHint
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "accessibilityHint",
                                         sourceProps.accessibilityHint,
                                         "")),
      accessibilityLanguage(
          enablePropIteratorSetter ? sourceProps.accessibilityLanguage
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "accessibilityLanguage",
                                         sourceProps.accessibilityLanguage,
                                         "")),
      accessibilityValue(
          enablePropIteratorSetter ? sourceProps.accessibilityValue
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "accessibilityValue",
                                         sourceProps.accessibilityValue,
                                         {})),
      accessibilityActions(
          enablePropIteratorSetter ? sourceProps.accessibilityActions
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "accessibilityActions",
                                         sourceProps.accessibilityActions,
                                         {})),
      accessibilityViewIsModal(
          enablePropIteratorSetter ? sourceProps.accessibilityViewIsModal
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "accessibilityViewIsModal",
                                         sourceProps.accessibilityViewIsModal,
                                         false)),
      accessibilityElementsHidden(
          enablePropIteratorSetter
              ? sourceProps.accessibilityElementsHidden
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityElementsHidden",
                    sourceProps.accessibilityElementsHidden,
                    false)),
      accessibilityIgnoresInvertColors(
          enablePropIteratorSetter
              ? sourceProps.accessibilityIgnoresInvertColors
              : convertRawProp(
                    context,
                    rawProps,
                    "accessibilityIgnoresInvertColors",
                    sourceProps.accessibilityIgnoresInvertColors,
                    false)),
      onAccessibilityTap(
          enablePropIteratorSetter ? sourceProps.onAccessibilityTap
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "onAccessibilityTap",
                                         sourceProps.onAccessibilityTap,
                                         {})),
      onAccessibilityMagicTap(
          enablePropIteratorSetter ? sourceProps.onAccessibilityMagicTap
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "onAccessibilityMagicTap",
                                         sourceProps.onAccessibilityMagicTap,
                                         {})),
      onAccessibilityEscape(
          enablePropIteratorSetter ? sourceProps.onAccessibilityEscape
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "onAccessibilityEscape",
                                         sourceProps.onAccessibilityEscape,
                                         {})),
      onAccessibilityAction(
          enablePropIteratorSetter ? sourceProps.onAccessibilityAction
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "onAccessibilityAction",
                                         sourceProps.onAccessibilityAction,
                                         {})),
      importantForAccessibility(
          enablePropIteratorSetter ? sourceProps.importantForAccessibility
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "importantForAccessibility",
                                         sourceProps.importantForAccessibility,
                                         ImportantForAccessibility::Auto)),
      testId(
          enablePropIteratorSetter ? sourceProps.testId
                                   : convertRawProp(
                                         context,
                                         rawProps,
                                         "testID",
                                         sourceProps.testId,
                                         "")) {
  // It is a (severe!) perf deoptimization to request props out-of-order.
  // Thus, since we need to request the same prop twice here
  // (accessibilityRole) we "must" do them subsequently here to prevent
  // a regression. It is reasonable to ask if the `at` function can be improved;
  // it probably can, but this is a fairly rare edge-case that (1) is easy-ish
  // to work around here, and (2) would require very careful work to address
  // this case and not regress the more common cases.
  if (!enablePropIteratorSetter) {
    const auto *rawPropValue =
        rawProps.at("accessibilityRole", nullptr, nullptr);
    AccessibilityTraits traits;
    std::string roleString;
    if (rawPropValue == nullptr || !rawPropValue->hasValue()) {
      traits = AccessibilityTraits::None;
      roleString = "";
    } else {
      fromRawValue(context, *rawPropValue, traits);
      fromRawValue(context, *rawPropValue, roleString);
    }
    accessibilityTraits = traits;
    accessibilityRole = roleString;
  }
}

void AccessibilityProps::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char *propName,
    RawValue const &value) {
  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessible, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityState, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLabel, std::string{""});
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLabelledBy, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityHint, std::string{""});
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityLanguage, std::string{""});
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityValue, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityActions, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityViewIsModal, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityElementsHidden, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(accessibilityIgnoresInvertColors, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityTap, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityMagicTap, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityEscape, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(onAccessibilityAction, {});
    RAW_SET_PROP_SWITCH_CASE_BASIC(
        importantForAccessibility, ImportantForAccessibility::Auto);
    RAW_SET_PROP_SWITCH_CASE(testId, "testID", std::string{""});
    case CONSTEXPR_RAW_PROPS_KEY_HASH("accessibilityRole"): {
      AccessibilityTraits traits = AccessibilityTraits::None;
      std::string roleString = "";
      if (value.hasValue()) {
        fromRawValue(context, value, traits);
        fromRawValue(context, value, roleString);
      }

      accessibilityTraits = traits;
      accessibilityRole = roleString;
      return;
    }
  }
}

#pragma mark - DebugStringConvertible

#if ABI47_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList AccessibilityProps::getDebugProps() const {
  auto const &defaultProps = AccessibilityProps();
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem("testId", testId, defaultProps.testId),
  };
}
#endif // ABI47_0_0RN_DEBUG_STRING_CONVERTIBLE

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
