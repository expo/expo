/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI35_0_0/components/view/conversions.h>
#include <ReactABI35_0_0/core/propsConversions.h>

namespace facebook {
namespace ReactABI35_0_0 {

static inline ABI35_0_0YGStyle::Dimensions convertRawProp(
    const RawProps &rawProps,
    const std::string &widthName,
    const std::string &heightName,
    const ABI35_0_0YGStyle::Dimensions &sourceValue,
    const ABI35_0_0YGStyle::Dimensions &defaultValue) {
  auto dimensions = defaultValue;
  dimensions[ABI35_0_0YGDimensionWidth] = convertRawProp(
      rawProps,
      widthName,
      sourceValue[ABI35_0_0YGDimensionWidth],
      defaultValue[ABI35_0_0YGDimensionWidth]);
  dimensions[ABI35_0_0YGDimensionHeight] = convertRawProp(
      rawProps,
      heightName,
      sourceValue[ABI35_0_0YGDimensionHeight],
      defaultValue[ABI35_0_0YGDimensionWidth]);
  return dimensions;
}

static inline ABI35_0_0YGStyle::Edges convertRawProp(
    const RawProps &rawProps,
    const std::string &prefix,
    const std::string &suffix,
    const ABI35_0_0YGStyle::Edges &sourceValue,
    const ABI35_0_0YGStyle::Edges &defaultValue) {
  auto result = defaultValue;
  result[ABI35_0_0YGEdgeLeft] = convertRawProp(
      rawProps,
      prefix + "Left" + suffix,
      sourceValue[ABI35_0_0YGEdgeLeft],
      defaultValue[ABI35_0_0YGEdgeLeft]);
  result[ABI35_0_0YGEdgeTop] = convertRawProp(
      rawProps,
      prefix + "Top" + suffix,
      sourceValue[ABI35_0_0YGEdgeTop],
      defaultValue[ABI35_0_0YGEdgeTop]);
  result[ABI35_0_0YGEdgeRight] = convertRawProp(
      rawProps,
      prefix + "Right" + suffix,
      sourceValue[ABI35_0_0YGEdgeRight],
      defaultValue[ABI35_0_0YGEdgeRight]);
  result[ABI35_0_0YGEdgeBottom] = convertRawProp(
      rawProps,
      prefix + "Bottom" + suffix,
      sourceValue[ABI35_0_0YGEdgeBottom],
      defaultValue[ABI35_0_0YGEdgeBottom]);
  result[ABI35_0_0YGEdgeStart] = convertRawProp(
      rawProps,
      prefix + "Start" + suffix,
      sourceValue[ABI35_0_0YGEdgeStart],
      defaultValue[ABI35_0_0YGEdgeStart]);
  result[ABI35_0_0YGEdgeEnd] = convertRawProp(
      rawProps,
      prefix + "End" + suffix,
      sourceValue[ABI35_0_0YGEdgeEnd],
      defaultValue[ABI35_0_0YGEdgeEnd]);
  result[ABI35_0_0YGEdgeHorizontal] = convertRawProp(
      rawProps,
      prefix + "Horizontal" + suffix,
      sourceValue[ABI35_0_0YGEdgeHorizontal],
      defaultValue[ABI35_0_0YGEdgeHorizontal]);
  result[ABI35_0_0YGEdgeVertical] = convertRawProp(
      rawProps,
      prefix + "Vertical" + suffix,
      sourceValue[ABI35_0_0YGEdgeVertical],
      defaultValue[ABI35_0_0YGEdgeVertical]);
  result[ABI35_0_0YGEdgeAll] = convertRawProp(
      rawProps,
      prefix + suffix,
      sourceValue[ABI35_0_0YGEdgeAll],
      defaultValue[ABI35_0_0YGEdgeAll]);
  return result;
}

static inline ABI35_0_0YGStyle::Edges convertRawProp(
    const RawProps &rawProps,
    const ABI35_0_0YGStyle::Edges &sourceValue,
    const ABI35_0_0YGStyle::Edges &defaultValue) {
  auto result = defaultValue;
  result[ABI35_0_0YGEdgeLeft] = convertRawProp(
      rawProps, "left", sourceValue[ABI35_0_0YGEdgeLeft], defaultValue[ABI35_0_0YGEdgeLeft]);
  result[ABI35_0_0YGEdgeTop] = convertRawProp(
      rawProps, "top", sourceValue[ABI35_0_0YGEdgeTop], defaultValue[ABI35_0_0YGEdgeTop]);
  result[ABI35_0_0YGEdgeRight] = convertRawProp(
      rawProps, "right", sourceValue[ABI35_0_0YGEdgeRight], defaultValue[ABI35_0_0YGEdgeRight]);
  result[ABI35_0_0YGEdgeBottom] = convertRawProp(
      rawProps,
      "bottom",
      sourceValue[ABI35_0_0YGEdgeBottom],
      defaultValue[ABI35_0_0YGEdgeBottom]);
  result[ABI35_0_0YGEdgeStart] = convertRawProp(
      rawProps, "start", sourceValue[ABI35_0_0YGEdgeStart], defaultValue[ABI35_0_0YGEdgeStart]);
  result[ABI35_0_0YGEdgeEnd] = convertRawProp(
      rawProps, "end", sourceValue[ABI35_0_0YGEdgeEnd], defaultValue[ABI35_0_0YGEdgeEnd]);
  return result;
}

static inline ABI35_0_0YGStyle convertRawProp(
    const RawProps &rawProps,
    const ABI35_0_0YGStyle &sourceValue) {
  auto ABI35_0_0yogaStyle = ABI35_0_0YGStyle{};
  ABI35_0_0yogaStyle.direction = convertRawProp(
      rawProps, "direction", sourceValue.direction, ABI35_0_0yogaStyle.direction);
  ABI35_0_0yogaStyle.flexDirection = convertRawProp(
      rawProps,
      "flexDirection",
      sourceValue.flexDirection,
      ABI35_0_0yogaStyle.flexDirection);
  ABI35_0_0yogaStyle.justifyContent = convertRawProp(
      rawProps,
      "justifyContent",
      sourceValue.justifyContent,
      ABI35_0_0yogaStyle.justifyContent);
  ABI35_0_0yogaStyle.alignContent = convertRawProp(
      rawProps,
      "alignContent",
      sourceValue.alignContent,
      ABI35_0_0yogaStyle.alignContent);
  ABI35_0_0yogaStyle.alignItems = convertRawProp(
      rawProps, "alignItems", sourceValue.alignItems, ABI35_0_0yogaStyle.alignItems);
  ABI35_0_0yogaStyle.alignSelf = convertRawProp(
      rawProps, "alignSelf", sourceValue.alignSelf, ABI35_0_0yogaStyle.alignSelf);
  ABI35_0_0yogaStyle.positionType = convertRawProp(
      rawProps, "position", sourceValue.positionType, ABI35_0_0yogaStyle.positionType);
  ABI35_0_0yogaStyle.flexWrap = convertRawProp(
      rawProps, "flexWrap", sourceValue.flexWrap, ABI35_0_0yogaStyle.flexWrap);
  ABI35_0_0yogaStyle.overflow = convertRawProp(
      rawProps, "overflow", sourceValue.overflow, ABI35_0_0yogaStyle.overflow);
  ABI35_0_0yogaStyle.display = convertRawProp(
      rawProps, "display", sourceValue.display, ABI35_0_0yogaStyle.display);
  ABI35_0_0yogaStyle.flex =
      convertRawProp(rawProps, "flex", sourceValue.flex, ABI35_0_0yogaStyle.flex);
  ABI35_0_0yogaStyle.flexGrow = convertRawProp(
      rawProps, "flexGrow", sourceValue.flexGrow, ABI35_0_0yogaStyle.flexGrow);
  ABI35_0_0yogaStyle.flexShrink = convertRawProp(
      rawProps, "flexShrink", sourceValue.flexShrink, ABI35_0_0yogaStyle.flexShrink);
  ABI35_0_0yogaStyle.flexBasis = convertRawProp(
      rawProps, "flexBasis", sourceValue.flexBasis, ABI35_0_0yogaStyle.flexBasis);
  ABI35_0_0yogaStyle.margin = convertRawProp(
      rawProps, "margin", "", sourceValue.margin, ABI35_0_0yogaStyle.margin);
  ABI35_0_0yogaStyle.position =
      convertRawProp(rawProps, sourceValue.position, ABI35_0_0yogaStyle.position);
  ABI35_0_0yogaStyle.padding = convertRawProp(
      rawProps, "padding", "", sourceValue.padding, ABI35_0_0yogaStyle.padding);
  ABI35_0_0yogaStyle.border = convertRawProp(
      rawProps, "border", "Width", sourceValue.border, ABI35_0_0yogaStyle.border);
  ABI35_0_0yogaStyle.dimensions = convertRawProp(
      rawProps,
      "width",
      "height",
      sourceValue.dimensions,
      ABI35_0_0yogaStyle.dimensions);
  ABI35_0_0yogaStyle.minDimensions = convertRawProp(
      rawProps,
      "minWidth",
      "minHeight",
      sourceValue.minDimensions,
      ABI35_0_0yogaStyle.minDimensions);
  ABI35_0_0yogaStyle.maxDimensions = convertRawProp(
      rawProps,
      "maxWidth",
      "maxHeight",
      sourceValue.maxDimensions,
      ABI35_0_0yogaStyle.maxDimensions);
  ABI35_0_0yogaStyle.aspectRatio = convertRawProp(
      rawProps, "aspectRatio", sourceValue.aspectRatio, ABI35_0_0yogaStyle.aspectRatio);
  return ABI35_0_0yogaStyle;
}

template <typename T>
static inline CascadedRectangleCorners<T> convertRawProp(
    const RawProps &rawProps,
    const std::string &prefix,
    const std::string &suffix,
    const CascadedRectangleCorners<T> &sourceValue) {
  CascadedRectangleCorners<T> result;

  result.topLeft = convertRawProp(
      rawProps, prefix + "TopLeft" + suffix, sourceValue.topLeft);
  result.topRight = convertRawProp(
      rawProps, prefix + "TopRight" + suffix, sourceValue.topRight);
  result.bottomLeft = convertRawProp(
      rawProps, prefix + "BottomLeft" + suffix, sourceValue.bottomLeft);
  result.bottomRight = convertRawProp(
      rawProps, prefix + "BottomRight" + suffix, sourceValue.bottomRight);

  result.topStart = convertRawProp(
      rawProps, prefix + "TopStart" + suffix, sourceValue.topStart);
  result.topEnd =
      convertRawProp(rawProps, prefix + "TopEnd" + suffix, sourceValue.topEnd);
  result.bottomStart = convertRawProp(
      rawProps, prefix + "BottomStart" + suffix, sourceValue.bottomStart);
  result.bottomEnd = convertRawProp(
      rawProps, prefix + "BottomEnd" + suffix, sourceValue.bottomEnd);

  result.all = convertRawProp(rawProps, prefix + suffix, sourceValue.all);

  return result;
}

template <typename T>
static inline CascadedRectangleEdges<T> convertRawProp(
    const RawProps &rawProps,
    const std::string &prefix,
    const std::string &suffix,
    const CascadedRectangleEdges<T> &sourceValue) {
  CascadedRectangleEdges<T> result;

  result.left =
      convertRawProp(rawProps, prefix + "Left" + suffix, sourceValue.left);
  result.right =
      convertRawProp(rawProps, prefix + "Right" + suffix, sourceValue.right);
  result.top =
      convertRawProp(rawProps, prefix + "Top" + suffix, sourceValue.top);
  result.bottom =
      convertRawProp(rawProps, prefix + "Bottom" + suffix, sourceValue.bottom);

  result.start =
      convertRawProp(rawProps, prefix + "Start" + suffix, sourceValue.start);
  result.end =
      convertRawProp(rawProps, prefix + "End" + suffix, sourceValue.end);
  result.horizontal = convertRawProp(
      rawProps, prefix + "Horizontal" + suffix, sourceValue.horizontal);
  result.vertical = convertRawProp(
      rawProps, prefix + "Vertical" + suffix, sourceValue.vertical);

  result.all = convertRawProp(rawProps, prefix + suffix, sourceValue.all);

  return result;
}

} // namespace ReactABI35_0_0
} // namespace facebook
