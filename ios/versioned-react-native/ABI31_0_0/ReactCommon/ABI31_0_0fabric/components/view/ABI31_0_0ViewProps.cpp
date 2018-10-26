/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0ViewProps.h"

#include <ABI31_0_0fabric/ABI31_0_0components/view/conversions.h>
#include <ABI31_0_0fabric/ABI31_0_0core/propsConversions.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/debugStringConvertibleUtils.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/conversions.h>

namespace facebook {
namespace ReactABI31_0_0 {

ViewProps::ViewProps(const ABI31_0_0YGStyle &yogaStyle):
  YogaStylableProps(yogaStyle) {}

ViewProps::ViewProps(const ViewProps &sourceProps, const RawProps &rawProps):
  Props(sourceProps, rawProps),
  YogaStylableProps(sourceProps, rawProps),
  opacity(convertRawProp(rawProps, "opacity", sourceProps.opacity, (Float)1.0)),
  foregroundColor(convertRawProp(rawProps, "foregroundColor", sourceProps.foregroundColor)),
  backgroundColor(convertRawProp(rawProps, "backgroundColor", sourceProps.backgroundColor)),
  borderWidth(convertRawProp(rawProps, "borderWidth", sourceProps.borderWidth)),
  borderRadius(convertRawProp(rawProps, "borderRadius", sourceProps.borderRadius)),
  borderColor(convertRawProp(rawProps, "borderColor", sourceProps.borderColor)),
  borderStyle(convertRawProp(rawProps, "borderStyle", sourceProps.borderStyle)),
  shadowColor(convertRawProp(rawProps, "shadowColor", sourceProps.shadowColor)),
  shadowOffset(convertRawProp(rawProps, "shadowOffset", sourceProps.shadowOffset)),
  shadowOpacity(convertRawProp(rawProps, "shadowOpacity", sourceProps.shadowOpacity)),
  shadowRadius(convertRawProp(rawProps, "shadowRadius", sourceProps.shadowRadius)),
  transform(convertRawProp(rawProps, "transform", sourceProps.transform)),
  backfaceVisibility(convertRawProp(rawProps, "backfaceVisibility", sourceProps.backfaceVisibility)),
  shouldRasterize(convertRawProp(rawProps, "shouldRasterize", sourceProps.shouldRasterize)),
  zIndex(convertRawProp(rawProps, "zIndex", sourceProps.zIndex)),
  pointerEvents(convertRawProp(rawProps, "pointerEvents", sourceProps.pointerEvents)),
  hitSlop(convertRawProp(rawProps, "hitSlop", sourceProps.hitSlop)),
  onLayout(convertRawProp(rawProps, "onLayout", sourceProps.onLayout)) {};

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList ViewProps::getDebugProps() const {
  const auto &defaultViewProps = ViewProps();

  return
    AccessibilityProps::getDebugProps() +
    YogaStylableProps::getDebugProps() +
    SharedDebugStringConvertibleList {
      debugStringConvertibleItem("zIndex", zIndex, defaultViewProps.zIndex),
      debugStringConvertibleItem("opacity", opacity, defaultViewProps.opacity),
      debugStringConvertibleItem("foregroundColor", foregroundColor, defaultViewProps.foregroundColor),
      debugStringConvertibleItem("backgroundColor", backgroundColor, defaultViewProps.backgroundColor),
    };
}

} // namespace ReactABI31_0_0
} // namespace facebook
