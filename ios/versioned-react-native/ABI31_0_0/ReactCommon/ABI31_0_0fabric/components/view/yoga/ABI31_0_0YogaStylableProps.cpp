/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0YogaStylableProps.h"

#include <ABI31_0_0fabric/ABI31_0_0components/view/conversions.h>
#include <ABI31_0_0fabric/ABI31_0_0core/propsConversions.h>
#include <ABI31_0_0fabric/ABI31_0_0components/view/propsConversions.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/debugStringConvertibleUtils.h>
#include <ABI31_0_0yoga/ABI31_0_0YGNode.h>
#include <ABI31_0_0yoga/ABI31_0_0Yoga.h>

#include "ABI31_0_0conversions.h"

namespace facebook {
namespace ReactABI31_0_0 {

YogaStylableProps::YogaStylableProps(const ABI31_0_0YGStyle &yogaStyle):
  yogaStyle(yogaStyle) {}

YogaStylableProps::YogaStylableProps(const YogaStylableProps &sourceProps, const RawProps &rawProps):
  yogaStyle(convertRawProp(rawProps, sourceProps.yogaStyle)) {};

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList YogaStylableProps::getDebugProps() const {
  ABI31_0_0YGStyle defaultYogaStyle;
  return {
    debugStringConvertibleItem("direction", yogaStyle.direction, defaultYogaStyle.direction),
    debugStringConvertibleItem("flexDirection", yogaStyle.flexDirection, defaultYogaStyle.flexDirection),
    debugStringConvertibleItem("justifyContent", yogaStyle.justifyContent, defaultYogaStyle.justifyContent),
    debugStringConvertibleItem("alignContent", yogaStyle.alignContent, defaultYogaStyle.alignContent),
    debugStringConvertibleItem("alignItems", yogaStyle.alignItems, defaultYogaStyle.alignItems),
    debugStringConvertibleItem("alignSelf", yogaStyle.alignSelf, defaultYogaStyle.alignSelf),
    debugStringConvertibleItem("positionType", yogaStyle.positionType, defaultYogaStyle.positionType),
    debugStringConvertibleItem("flexWrap", yogaStyle.flexWrap, defaultYogaStyle.flexWrap),
    debugStringConvertibleItem("overflow", yogaStyle.overflow, defaultYogaStyle.overflow),
    debugStringConvertibleItem("display", yogaStyle.display, defaultYogaStyle.display),
    debugStringConvertibleItem("flex", yogaStyle.flex, defaultYogaStyle.flex),
    debugStringConvertibleItem("flexGrow", yogaStyle.flexGrow, defaultYogaStyle.flexGrow),
    debugStringConvertibleItem("flexShrink", yogaStyle.flexShrink, defaultYogaStyle.flexShrink),
    debugStringConvertibleItem("flexBasis", yogaStyle.flexBasis, defaultYogaStyle.flexBasis),
    debugStringConvertibleItem("margin", yogaStyle.margin, defaultYogaStyle.margin),
    debugStringConvertibleItem("position", yogaStyle.position, defaultYogaStyle.position),
    debugStringConvertibleItem("padding", yogaStyle.padding, defaultYogaStyle.padding),
    debugStringConvertibleItem("border", yogaStyle.border, defaultYogaStyle.border),
    debugStringConvertibleItem("dimensions", yogaStyle.dimensions, defaultYogaStyle.dimensions),
    debugStringConvertibleItem("minDimensions", yogaStyle.minDimensions, defaultYogaStyle.minDimensions),
    debugStringConvertibleItem("maxDimensions", yogaStyle.maxDimensions, defaultYogaStyle.maxDimensions),
    debugStringConvertibleItem("aspectRatio", yogaStyle.aspectRatio, defaultYogaStyle.aspectRatio),
  };
}

} // namespace ReactABI31_0_0
} // namespace facebook
