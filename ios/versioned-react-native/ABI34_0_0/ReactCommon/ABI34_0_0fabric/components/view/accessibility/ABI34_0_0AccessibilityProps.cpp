/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0AccessibilityProps.h"

#include <ReactABI34_0_0/components/view/accessibilityPropsConversions.h>
#include <ReactABI34_0_0/components/view/propsConversions.h>
#include <ReactABI34_0_0/core/propsConversions.h>
#include <ReactABI34_0_0/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace ReactABI34_0_0 {

AccessibilityProps::AccessibilityProps(
    const AccessibilityProps &sourceProps,
    const RawProps &rawProps)
    : accessible(
          convertRawProp(rawProps, "accessible", sourceProps.accessible)),
      accessibilityTraits(convertRawProp(
          rawProps,
          "accessibilityTraits",
          sourceProps.accessibilityTraits)),
      accessibilityLabel(convertRawProp(
          rawProps,
          "accessibilityLabel",
          sourceProps.accessibilityLabel)),
      accessibilityHint(convertRawProp(
          rawProps,
          "accessibilityHint",
          sourceProps.accessibilityHint)),
      accessibilityActions(convertRawProp(
          rawProps,
          "accessibilityActions",
          sourceProps.accessibilityActions)),
      accessibilityViewIsModal(convertRawProp(
          rawProps,
          "accessibilityViewIsModal",
          sourceProps.accessibilityViewIsModal)),
      accessibilityElementsHidden(convertRawProp(
          rawProps,
          "accessibilityElementsHidden",
          sourceProps.accessibilityElementsHidden)),
      accessibilityIgnoresInvertColors(convertRawProp(
          rawProps,
          "accessibilityIgnoresInvertColors",
          sourceProps.accessibilityIgnoresInvertColors)),
      testId(convertRawProp(rawProps, "testId", sourceProps.testId)) {}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList AccessibilityProps::getDebugProps() const {
  const auto &defaultProps = AccessibilityProps();
  LOG(INFO) << "Call AccessibilityProps::getDebugProps with testId " << testId;
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem("testId", testId, defaultProps.testId),
  };
}
#endif // RN_DEBUG_STRING_CONVERTIBLE

} // namespace ReactABI34_0_0
} // namespace facebook
