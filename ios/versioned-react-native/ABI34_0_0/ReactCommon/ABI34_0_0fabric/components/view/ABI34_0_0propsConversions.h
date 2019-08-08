/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/view/conversions.h>
#include <ReactABI34_0_0/core/propsConversions.h>

namespace facebook {
namespace ReactABI34_0_0 {

static inline ABI34_0_0YGStyle::Dimensions convertRawProp(
    const RawProps &rawProps,
    const std::string &widthName,
    const std::string &heightName,
    const ABI34_0_0YGStyle::Dimensions &sourceValue,
    const ABI34_0_0YGStyle::Dimensions &defaultValue) {
  auto dimensions = defaultValue;
  dimensions[ABI34_0_0YGDimensionWidth] = convertRawProp(
      rawProps,
      widthName,
      sourceValue[ABI34_0_0YGDimensionWidth],
      defaultValue[ABI34_0_0YGDimensionWidth]);
  dimensions[ABI34_0_0YGDimensionHeight] = convertRawProp(
      rawProps,
      heightName,
      sourceValue[ABI34_0_0YGDimensionHeight],
      defaultValue[ABI34_0_0YGDimensionWidth]);
  return dimensions;
}

static inline ABI34_0_0YGStyle::Edges convertRawProp(
    const RawProps &rawProps,
    const std::string &prefix,
    const std::string &suffix,
    const ABI34_0_0YGStyle::Edges &sourceValue,
    const ABI34_0_0YGStyle::Edges &defaultValue) {
  auto result = defaultValue;
  result[ABI34_0_0YGEdgeLeft] = convertRawProp(
      rawProps,
      prefix + "Left" + suffix,
      sourceValue[ABI34_0_0YGEdgeLeft],
      defaultValue[ABI34_0_0YGEdgeLeft]);
  result[ABI34_0_0YGEdgeTop] = convertRawProp(
      rawProps,
      prefix + "Top" + suffix,
      sourceValue[ABI34_0_0YGEdgeTop],
      defaultValue[ABI34_0_0YGEdgeTop]);
  result[ABI34_0_0YGEdgeRight] = convertRawProp(
      rawProps,
      prefix + "Right" + suffix,
      sourceValue[ABI34_0_0YGEdgeRight],
      defaultValue[ABI34_0_0YGEdgeRight]);
  result[ABI34_0_0YGEdgeBottom] = convertRawProp(
      rawProps,
      prefix + "Bottom" + suffix,
      sourceValue[ABI34_0_0YGEdgeBottom],
      defaultValue[ABI34_0_0YGEdgeBottom]);
  result[ABI34_0_0YGEdgeStart] = convertRawProp(
      rawProps,
      prefix + "Start" + suffix,
      sourceValue[ABI34_0_0YGEdgeStart],
      defaultValue[ABI34_0_0YGEdgeStart]);
  result[ABI34_0_0YGEdgeEnd] = convertRawProp(
      rawProps,
      prefix + "End" + suffix,
      sourceValue[ABI34_0_0YGEdgeEnd],
      defaultValue[ABI34_0_0YGEdgeEnd]);
  result[ABI34_0_0YGEdgeHorizontal] = convertRawProp(
      rawProps,
      prefix + "Horizontal" + suffix,
      sourceValue[ABI34_0_0YGEdgeHorizontal],
      defaultValue[ABI34_0_0YGEdgeHorizontal]);
  result[ABI34_0_0YGEdgeVertical] = convertRawProp(
      rawProps,
      prefix + "Vertical" + suffix,
      sourceValue[ABI34_0_0YGEdgeVertical],
      defaultValue[ABI34_0_0YGEdgeVertical]);
  result[ABI34_0_0YGEdgeAll] = convertRawProp(
      rawProps,
      prefix + suffix,
      sourceValue[ABI34_0_0YGEdgeAll],
      defaultValue[ABI34_0_0YGEdgeAll]);
  return result;
}

static inline ABI34_0_0YGStyle::Edges convertRawProp(
    const RawProps &rawProps,
    const ABI34_0_0YGStyle::Edges &sourceValue,
    const ABI34_0_0YGStyle::Edges &defaultValue) {
  auto result = defaultValue;
  result[ABI34_0_0YGEdgeLeft] = convertRawProp(
      rawProps, "left", sourceValue[ABI34_0_0YGEdgeLeft], defaultValue[ABI34_0_0YGEdgeLeft]);
  result[ABI34_0_0YGEdgeTop] = convertRawProp(
      rawProps, "top", sourceValue[ABI34_0_0YGEdgeTop], defaultValue[ABI34_0_0YGEdgeTop]);
  result[ABI34_0_0YGEdgeRight] = convertRawProp(
      rawProps, "right", sourceValue[ABI34_0_0YGEdgeRight], defaultValue[ABI34_0_0YGEdgeRight]);
  result[ABI34_0_0YGEdgeBottom] = convertRawProp(
      rawProps,
      "bottom",
      sourceValue[ABI34_0_0YGEdgeBottom],
      defaultValue[ABI34_0_0YGEdgeBottom]);
  result[ABI34_0_0YGEdgeStart] = convertRawProp(
      rawProps, "start", sourceValue[ABI34_0_0YGEdgeStart], defaultValue[ABI34_0_0YGEdgeStart]);
  result[ABI34_0_0YGEdgeEnd] = convertRawProp(
      rawProps, "end", sourceValue[ABI34_0_0YGEdgeEnd], defaultValue[ABI34_0_0YGEdgeEnd]);
  return result;
}

static inline ABI34_0_0YGStyle convertRawProp(
    const RawProps &rawProps,
    const ABI34_0_0YGStyle &sourceValue) {
  auto ABI34_0_0yogaStyle = ABI34_0_0YGStyle{};
  ABI34_0_0yogaStyle.direction = convertRawProp(
      rawProps, "direction", sourceValue.direction, ABI34_0_0yogaStyle.direction);
  ABI34_0_0yogaStyle.flexDirection = convertRawProp(
      rawProps,
      "flexDirection",
      sourceValue.flexDirection,
      ABI34_0_0yogaStyle.flexDirection);
  ABI34_0_0yogaStyle.justifyContent = convertRawProp(
      rawProps,
      "justifyContent",
      sourceValue.justifyContent,
      ABI34_0_0yogaStyle.justifyContent);
  ABI34_0_0yogaStyle.alignContent = convertRawProp(
      rawProps,
      "alignContent",
      sourceValue.alignContent,
      ABI34_0_0yogaStyle.alignContent);
  ABI34_0_0yogaStyle.alignItems = convertRawProp(
      rawProps, "alignItems", sourceValue.alignItems, ABI34_0_0yogaStyle.alignItems);
  ABI34_0_0yogaStyle.alignSelf = convertRawProp(
      rawProps, "alignSelf", sourceValue.alignSelf, ABI34_0_0yogaStyle.alignSelf);
  ABI34_0_0yogaStyle.positionType = convertRawProp(
      rawProps, "position", sourceValue.positionType, ABI34_0_0yogaStyle.positionType);
  ABI34_0_0yogaStyle.flexWrap = convertRawProp(
      rawProps, "flexWrap", sourceValue.flexWrap, ABI34_0_0yogaStyle.flexWrap);
  ABI34_0_0yogaStyle.overflow = convertRawProp(
      rawProps, "overflow", sourceValue.overflow, ABI34_0_0yogaStyle.overflow);
  ABI34_0_0yogaStyle.display = convertRawProp(
      rawProps, "display", sourceValue.display, ABI34_0_0yogaStyle.display);
  ABI34_0_0yogaStyle.flex =
      convertRawProp(rawProps, "flex", sourceValue.flex, ABI34_0_0yogaStyle.flex);
  ABI34_0_0yogaStyle.flexGrow = convertRawProp(
      rawProps, "flexGrow", sourceValue.flexGrow, ABI34_0_0yogaStyle.flexGrow);
  ABI34_0_0yogaStyle.flexShrink = convertRawProp(
      rawProps, "flexShrink", sourceValue.flexShrink, ABI34_0_0yogaStyle.flexShrink);
  ABI34_0_0yogaStyle.flexBasis = convertRawProp(
      rawProps, "flexBasis", sourceValue.flexBasis, ABI34_0_0yogaStyle.flexBasis);
  ABI34_0_0yogaStyle.margin = convertRawProp(
      rawProps, "margin", "", sourceValue.margin, ABI34_0_0yogaStyle.margin);
  ABI34_0_0yogaStyle.position =
      convertRawProp(rawProps, sourceValue.position, ABI34_0_0yogaStyle.position);
  ABI34_0_0yogaStyle.padding = convertRawProp(
      rawProps, "padding", "", sourceValue.padding, ABI34_0_0yogaStyle.padding);
  ABI34_0_0yogaStyle.border = convertRawProp(
      rawProps, "border", "Width", sourceValue.border, ABI34_0_0yogaStyle.border);
  ABI34_0_0yogaStyle.dimensions = convertRawProp(
      rawProps,
      "width",
      "height",
      sourceValue.dimensions,
      ABI34_0_0yogaStyle.dimensions);
  ABI34_0_0yogaStyle.minDimensions = convertRawProp(
      rawProps,
      "minWidth",
      "minHeight",
      sourceValue.minDimensions,
      ABI34_0_0yogaStyle.minDimensions);
  ABI34_0_0yogaStyle.maxDimensions = convertRawProp(
      rawProps,
      "maxWidth",
      "maxHeight",
      sourceValue.maxDimensions,
      ABI34_0_0yogaStyle.maxDimensions);
  ABI34_0_0yogaStyle.aspectRatio = convertRawProp(
      rawProps, "aspectRatio", sourceValue.aspectRatio, ABI34_0_0yogaStyle.aspectRatio);
  return ABI34_0_0yogaStyle;
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

} // namespace ReactABI34_0_0
} // namespace facebook
