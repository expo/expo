/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI37_0_0React/components/view/conversions.h>
#include <ABI37_0_0React/core/propsConversions.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

static inline ABI37_0_0YGStyle::Dimensions convertRawProp(
    RawProps const &rawProps,
    char const *widthName,
    char const *heightName,
    ABI37_0_0YGStyle::Dimensions const &sourceValue,
    ABI37_0_0YGStyle::Dimensions const &defaultValue) {
  auto dimensions = defaultValue;
  dimensions[ABI37_0_0YGDimensionWidth] = convertRawProp(
      rawProps,
      widthName,
      sourceValue[ABI37_0_0YGDimensionWidth],
      defaultValue[ABI37_0_0YGDimensionWidth]);
  dimensions[ABI37_0_0YGDimensionHeight] = convertRawProp(
      rawProps,
      heightName,
      sourceValue[ABI37_0_0YGDimensionHeight],
      defaultValue[ABI37_0_0YGDimensionWidth]);
  return dimensions;
}

static inline ABI37_0_0YGStyle::Edges convertRawProp(
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    ABI37_0_0YGStyle::Edges const &sourceValue,
    ABI37_0_0YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[ABI37_0_0YGEdgeLeft] = convertRawProp(
      rawProps,
      "Left",
      sourceValue[ABI37_0_0YGEdgeLeft],
      defaultValue[ABI37_0_0YGEdgeLeft],
      prefix,
      suffix);
  result[ABI37_0_0YGEdgeTop] = convertRawProp(
      rawProps,
      "Top",
      sourceValue[ABI37_0_0YGEdgeTop],
      defaultValue[ABI37_0_0YGEdgeTop],
      prefix,
      suffix);
  result[ABI37_0_0YGEdgeRight] = convertRawProp(
      rawProps,
      "Right",
      sourceValue[ABI37_0_0YGEdgeRight],
      defaultValue[ABI37_0_0YGEdgeRight],
      prefix,
      suffix);
  result[ABI37_0_0YGEdgeBottom] = convertRawProp(
      rawProps,
      "Bottom",
      sourceValue[ABI37_0_0YGEdgeBottom],
      defaultValue[ABI37_0_0YGEdgeBottom],
      prefix,
      suffix);
  result[ABI37_0_0YGEdgeStart] = convertRawProp(
      rawProps,
      "Start",
      sourceValue[ABI37_0_0YGEdgeStart],
      defaultValue[ABI37_0_0YGEdgeStart],
      prefix,
      suffix);
  result[ABI37_0_0YGEdgeEnd] = convertRawProp(
      rawProps,
      "End",
      sourceValue[ABI37_0_0YGEdgeEnd],
      defaultValue[ABI37_0_0YGEdgeEnd],
      prefix,
      suffix);
  result[ABI37_0_0YGEdgeHorizontal] = convertRawProp(
      rawProps,
      "Horizontal",
      sourceValue[ABI37_0_0YGEdgeHorizontal],
      defaultValue[ABI37_0_0YGEdgeHorizontal],
      prefix,
      suffix);
  result[ABI37_0_0YGEdgeVertical] = convertRawProp(
      rawProps,
      "Vertical",
      sourceValue[ABI37_0_0YGEdgeVertical],
      defaultValue[ABI37_0_0YGEdgeVertical],
      prefix,
      suffix);
  result[ABI37_0_0YGEdgeAll] = convertRawProp(
      rawProps,
      "",
      sourceValue[ABI37_0_0YGEdgeAll],
      defaultValue[ABI37_0_0YGEdgeAll],
      prefix,
      suffix);
  return result;
}

static inline ABI37_0_0YGStyle::Edges convertRawProp(
    RawProps const &rawProps,
    ABI37_0_0YGStyle::Edges const &sourceValue,
    ABI37_0_0YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[ABI37_0_0YGEdgeLeft] = convertRawProp(
      rawProps, "left", sourceValue[ABI37_0_0YGEdgeLeft], defaultValue[ABI37_0_0YGEdgeLeft]);
  result[ABI37_0_0YGEdgeTop] = convertRawProp(
      rawProps, "top", sourceValue[ABI37_0_0YGEdgeTop], defaultValue[ABI37_0_0YGEdgeTop]);
  result[ABI37_0_0YGEdgeRight] = convertRawProp(
      rawProps, "right", sourceValue[ABI37_0_0YGEdgeRight], defaultValue[ABI37_0_0YGEdgeRight]);
  result[ABI37_0_0YGEdgeBottom] = convertRawProp(
      rawProps,
      "bottom",
      sourceValue[ABI37_0_0YGEdgeBottom],
      defaultValue[ABI37_0_0YGEdgeBottom]);
  result[ABI37_0_0YGEdgeStart] = convertRawProp(
      rawProps, "start", sourceValue[ABI37_0_0YGEdgeStart], defaultValue[ABI37_0_0YGEdgeStart]);
  result[ABI37_0_0YGEdgeEnd] = convertRawProp(
      rawProps, "end", sourceValue[ABI37_0_0YGEdgeEnd], defaultValue[ABI37_0_0YGEdgeEnd]);
  return result;
}

static inline ABI37_0_0YGStyle convertRawProp(
    RawProps const &rawProps,
    ABI37_0_0YGStyle const &sourceValue) {
  auto yogaStyle = ABI37_0_0YGStyle{};
  yogaStyle.direction() = convertRawProp(
      rawProps, "direction", sourceValue.direction(), yogaStyle.direction());
  yogaStyle.flexDirection() = convertRawProp(
      rawProps,
      "flexDirection",
      sourceValue.flexDirection(),
      yogaStyle.flexDirection());
  yogaStyle.justifyContent() = convertRawProp(
      rawProps,
      "justifyContent",
      sourceValue.justifyContent(),
      yogaStyle.justifyContent());
  yogaStyle.alignContent() = convertRawProp(
      rawProps,
      "alignContent",
      sourceValue.alignContent(),
      yogaStyle.alignContent());
  yogaStyle.alignItems() = convertRawProp(
      rawProps, "alignItems", sourceValue.alignItems(), yogaStyle.alignItems());
  yogaStyle.alignSelf() = convertRawProp(
      rawProps, "alignSelf", sourceValue.alignSelf(), yogaStyle.alignSelf());
  yogaStyle.positionType() = convertRawProp(
      rawProps,
      "position",
      sourceValue.positionType(),
      yogaStyle.positionType());
  yogaStyle.flexWrap() = convertRawProp(
      rawProps, "flexWrap", sourceValue.flexWrap(), yogaStyle.flexWrap());
  yogaStyle.overflow() = convertRawProp(
      rawProps, "overflow", sourceValue.overflow(), yogaStyle.overflow());
  yogaStyle.display() = convertRawProp(
      rawProps, "display", sourceValue.display(), yogaStyle.display());
  yogaStyle.flex() =
      convertRawProp(rawProps, "flex", sourceValue.flex(), yogaStyle.flex());
  yogaStyle.flexGrow() = convertRawProp(
      rawProps, "flexGrow", sourceValue.flexGrow(), yogaStyle.flexGrow());
  yogaStyle.flexShrink() = convertRawProp(
      rawProps, "flexShrink", sourceValue.flexShrink(), yogaStyle.flexShrink());
  yogaStyle.flexBasis() = convertRawProp(
      rawProps, "flexBasis", sourceValue.flexBasis(), yogaStyle.flexBasis());
  yogaStyle.margin() = convertRawProp(
      rawProps, "margin", "", sourceValue.margin(), yogaStyle.margin());
  yogaStyle.position() =
      convertRawProp(rawProps, sourceValue.position(), yogaStyle.position());
  yogaStyle.padding() = convertRawProp(
      rawProps, "padding", "", sourceValue.padding(), yogaStyle.padding());
  yogaStyle.border() = convertRawProp(
      rawProps, "border", "Width", sourceValue.border(), yogaStyle.border());
  yogaStyle.dimensions() = convertRawProp(
      rawProps,
      "width",
      "height",
      sourceValue.dimensions(),
      yogaStyle.dimensions());
  yogaStyle.minDimensions() = convertRawProp(
      rawProps,
      "minWidth",
      "minHeight",
      sourceValue.minDimensions(),
      yogaStyle.minDimensions());
  yogaStyle.maxDimensions() = convertRawProp(
      rawProps,
      "maxWidth",
      "maxHeight",
      sourceValue.maxDimensions(),
      yogaStyle.maxDimensions());
  yogaStyle.aspectRatio() = convertRawProp(
      rawProps,
      "aspectRatio",
      sourceValue.aspectRatio(),
      yogaStyle.aspectRatio());
  return yogaStyle;
}

template <typename T>
static inline CascadedRectangleCorners<T> convertRawProp(
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    CascadedRectangleCorners<T> const &sourceValue) {
  CascadedRectangleCorners<T> result;

  result.topLeft = convertRawProp(
      rawProps, "TopLeft", sourceValue.topLeft, {}, prefix, suffix);
  result.topRight = convertRawProp(
      rawProps, "TopRight", sourceValue.topRight, {}, prefix, suffix);
  result.bottomLeft = convertRawProp(
      rawProps, "BottomLeft", sourceValue.bottomLeft, {}, prefix, suffix);
  result.bottomRight = convertRawProp(
      rawProps, "BottomRight", sourceValue.bottomRight, {}, prefix, suffix);

  result.topStart = convertRawProp(
      rawProps, "TopStart", sourceValue.topStart, {}, prefix, suffix);
  result.topEnd = convertRawProp(
      rawProps, "TopEnd", sourceValue.topEnd, {}, prefix, suffix);
  result.bottomStart = convertRawProp(
      rawProps, "BottomStart", sourceValue.bottomStart, {}, prefix, suffix);
  result.bottomEnd = convertRawProp(
      rawProps, "BottomEnd", sourceValue.bottomEnd, {}, prefix, suffix);

  result.all =
      convertRawProp(rawProps, "", sourceValue.all, {}, prefix, suffix);

  return result;
}

template <typename T>
static inline CascadedRectangleEdges<T> convertRawProp(
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    CascadedRectangleEdges<T> const &sourceValue) {
  CascadedRectangleEdges<T> result;

  result.left =
      convertRawProp(rawProps, "Left", sourceValue.left, {}, prefix, suffix);
  result.right =
      convertRawProp(rawProps, "Right", sourceValue.right, {}, prefix, suffix);
  result.top =
      convertRawProp(rawProps, "Top", sourceValue.top, {}, prefix, suffix);
  result.bottom = convertRawProp(
      rawProps, "Bottom", sourceValue.bottom, {}, prefix, suffix);

  result.start =
      convertRawProp(rawProps, "Start", sourceValue.start, {}, prefix, suffix);
  result.end =
      convertRawProp(rawProps, "End", sourceValue.end, {}, prefix, suffix);
  result.horizontal = convertRawProp(
      rawProps, "Horizontal", sourceValue.horizontal, {}, prefix, suffix);
  result.vertical = convertRawProp(
      rawProps, "Vertical", sourceValue.vertical, {}, prefix, suffix);

  result.all =
      convertRawProp(rawProps, "", sourceValue.all, {}, prefix, suffix);

  return result;
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
