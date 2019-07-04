/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0components/view/conversions.h>
#include <ABI31_0_0fabric/ABI31_0_0core/propsConversions.h>

namespace facebook {
namespace ReactABI31_0_0 {

static std::array<ABI31_0_0YGValue, 2> convertRawProp(const RawProps &rawProps, const std::string &widthName, const std::string &heightName, const std::array<ABI31_0_0YGValue, 2> &defaultValue) {
  std::array<ABI31_0_0YGValue, 2> dimentions;
  dimentions[ABI31_0_0YGDimensionWidth] = convertRawProp(rawProps, widthName, defaultValue[ABI31_0_0YGDimensionWidth]);
  dimentions[ABI31_0_0YGDimensionHeight] = convertRawProp(rawProps, heightName, defaultValue[ABI31_0_0YGDimensionHeight]);
  return dimentions;
}

static std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> convertRawProp(const RawProps &rawProps, const std::string &prefix, const std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> &defaultValue) {
  std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> result = defaultValue;
  result[ABI31_0_0YGEdgeLeft] = convertRawProp(rawProps, prefix + "Left", defaultValue[ABI31_0_0YGEdgeLeft]);
  result[ABI31_0_0YGEdgeTop] = convertRawProp(rawProps, prefix + "Top", defaultValue[ABI31_0_0YGEdgeTop]);
  result[ABI31_0_0YGEdgeRight] = convertRawProp(rawProps, prefix + "Right", defaultValue[ABI31_0_0YGEdgeRight]);
  result[ABI31_0_0YGEdgeBottom] = convertRawProp(rawProps, prefix + "Bottom", defaultValue[ABI31_0_0YGEdgeBottom]);
  result[ABI31_0_0YGEdgeStart] = convertRawProp(rawProps, prefix + "Start", defaultValue[ABI31_0_0YGEdgeStart]);
  result[ABI31_0_0YGEdgeEnd] = convertRawProp(rawProps, prefix + "End", defaultValue[ABI31_0_0YGEdgeEnd]);
  result[ABI31_0_0YGEdgeHorizontal] = convertRawProp(rawProps, prefix + "Horizontal", defaultValue[ABI31_0_0YGEdgeHorizontal]);
  result[ABI31_0_0YGEdgeVertical] = convertRawProp(rawProps, prefix + "Vertical", defaultValue[ABI31_0_0YGEdgeVertical]);
  result[ABI31_0_0YGEdgeAll] = convertRawProp(rawProps, prefix, defaultValue[ABI31_0_0YGEdgeAll]);
  return result;
}

static std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> convertRawProp(const RawProps &rawProps, const std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> &defaultValue) {
  std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> result = defaultValue;
  result[ABI31_0_0YGEdgeLeft] = convertRawProp(rawProps, "left", defaultValue[ABI31_0_0YGEdgeLeft]);
  result[ABI31_0_0YGEdgeTop] = convertRawProp(rawProps, "top", defaultValue[ABI31_0_0YGEdgeTop]);
  result[ABI31_0_0YGEdgeRight] = convertRawProp(rawProps, "right", defaultValue[ABI31_0_0YGEdgeRight]);
  result[ABI31_0_0YGEdgeBottom] = convertRawProp(rawProps, "bottom", defaultValue[ABI31_0_0YGEdgeBottom]);
  result[ABI31_0_0YGEdgeStart] = convertRawProp(rawProps, "start", defaultValue[ABI31_0_0YGEdgeStart]);
  result[ABI31_0_0YGEdgeEnd] = convertRawProp(rawProps, "end", defaultValue[ABI31_0_0YGEdgeEnd]);
  return result;
}

static ABI31_0_0YGStyle convertRawProp(const RawProps &rawProps, const ABI31_0_0YGStyle &defaultValue) {
  ABI31_0_0YGStyle yogaStyle;
  yogaStyle.direction = convertRawProp(rawProps, "direction", defaultValue.direction);
  yogaStyle.flexDirection = convertRawProp(rawProps, "flexDirection", defaultValue.flexDirection);
  yogaStyle.justifyContent = convertRawProp(rawProps, "justifyContent", defaultValue.justifyContent);
  yogaStyle.alignContent = convertRawProp(rawProps, "alignContent", defaultValue.alignContent);
  yogaStyle.alignItems = convertRawProp(rawProps, "alignItems", defaultValue.alignItems);
  yogaStyle.alignSelf = convertRawProp(rawProps, "alignSelf", defaultValue.alignSelf);
  yogaStyle.positionType = convertRawProp(rawProps, "position", defaultValue.positionType);
  yogaStyle.flexWrap = convertRawProp(rawProps, "flexWrap", defaultValue.flexWrap);
  yogaStyle.overflow = convertRawProp(rawProps, "overflow", defaultValue.overflow);
  yogaStyle.display = convertRawProp(rawProps, "display", defaultValue.display);
  yogaStyle.flex = convertRawProp(rawProps, "flex", defaultValue.flex);
  yogaStyle.flexGrow = convertRawProp(rawProps, "flexGrow", defaultValue.flexGrow);
  yogaStyle.flexShrink = convertRawProp(rawProps, "flexShrink", defaultValue.flexShrink);
  yogaStyle.flexBasis = convertRawProp(rawProps, "flexBasis", defaultValue.flexBasis);
  yogaStyle.margin = convertRawProp(rawProps, "margin", defaultValue.margin);
  yogaStyle.position = convertRawProp(rawProps, defaultValue.position);
  yogaStyle.padding = convertRawProp(rawProps, "padding", defaultValue.padding);
  yogaStyle.border = convertRawProp(rawProps, "border", defaultValue.border);
  yogaStyle.dimensions = convertRawProp(rawProps, "width", "height", defaultValue.dimensions);
  yogaStyle.minDimensions = convertRawProp(rawProps, "minWidth", "minHeight", defaultValue.minDimensions);
  yogaStyle.maxDimensions = convertRawProp(rawProps, "maxWidth", "maxHeight", defaultValue.maxDimensions);
  yogaStyle.aspectRatio = convertRawProp(rawProps, "aspectRatio", defaultValue.aspectRatio);
  return yogaStyle;
}

} // namespace ReactABI31_0_0
} // namespace facebook
