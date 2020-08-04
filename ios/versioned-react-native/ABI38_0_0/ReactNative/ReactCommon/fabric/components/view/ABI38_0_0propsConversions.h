/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI38_0_0React/components/view/conversions.h>
#include <ABI38_0_0React/core/propsConversions.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

static inline ABI38_0_0YGStyle::Dimensions convertRawProp(
    RawProps const &rawProps,
    char const *widthName,
    char const *heightName,
    ABI38_0_0YGStyle::Dimensions const &sourceValue,
    ABI38_0_0YGStyle::Dimensions const &defaultValue) {
  auto dimensions = defaultValue;
  dimensions[ABI38_0_0YGDimensionWidth] = convertRawProp(
      rawProps,
      widthName,
      sourceValue[ABI38_0_0YGDimensionWidth],
      defaultValue[ABI38_0_0YGDimensionWidth]);
  dimensions[ABI38_0_0YGDimensionHeight] = convertRawProp(
      rawProps,
      heightName,
      sourceValue[ABI38_0_0YGDimensionHeight],
      defaultValue[ABI38_0_0YGDimensionWidth]);
  return dimensions;
}

static inline ABI38_0_0YGStyle::Edges convertRawProp(
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    ABI38_0_0YGStyle::Edges const &sourceValue,
    ABI38_0_0YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[ABI38_0_0YGEdgeLeft] = convertRawProp(
      rawProps,
      "Left",
      sourceValue[ABI38_0_0YGEdgeLeft],
      defaultValue[ABI38_0_0YGEdgeLeft],
      prefix,
      suffix);
  result[ABI38_0_0YGEdgeTop] = convertRawProp(
      rawProps,
      "Top",
      sourceValue[ABI38_0_0YGEdgeTop],
      defaultValue[ABI38_0_0YGEdgeTop],
      prefix,
      suffix);
  result[ABI38_0_0YGEdgeRight] = convertRawProp(
      rawProps,
      "Right",
      sourceValue[ABI38_0_0YGEdgeRight],
      defaultValue[ABI38_0_0YGEdgeRight],
      prefix,
      suffix);
  result[ABI38_0_0YGEdgeBottom] = convertRawProp(
      rawProps,
      "Bottom",
      sourceValue[ABI38_0_0YGEdgeBottom],
      defaultValue[ABI38_0_0YGEdgeBottom],
      prefix,
      suffix);
  result[ABI38_0_0YGEdgeStart] = convertRawProp(
      rawProps,
      "Start",
      sourceValue[ABI38_0_0YGEdgeStart],
      defaultValue[ABI38_0_0YGEdgeStart],
      prefix,
      suffix);
  result[ABI38_0_0YGEdgeEnd] = convertRawProp(
      rawProps,
      "End",
      sourceValue[ABI38_0_0YGEdgeEnd],
      defaultValue[ABI38_0_0YGEdgeEnd],
      prefix,
      suffix);
  result[ABI38_0_0YGEdgeHorizontal] = convertRawProp(
      rawProps,
      "Horizontal",
      sourceValue[ABI38_0_0YGEdgeHorizontal],
      defaultValue[ABI38_0_0YGEdgeHorizontal],
      prefix,
      suffix);
  result[ABI38_0_0YGEdgeVertical] = convertRawProp(
      rawProps,
      "Vertical",
      sourceValue[ABI38_0_0YGEdgeVertical],
      defaultValue[ABI38_0_0YGEdgeVertical],
      prefix,
      suffix);
  result[ABI38_0_0YGEdgeAll] = convertRawProp(
      rawProps,
      "",
      sourceValue[ABI38_0_0YGEdgeAll],
      defaultValue[ABI38_0_0YGEdgeAll],
      prefix,
      suffix);
  return result;
}

static inline ABI38_0_0YGStyle::Edges convertRawProp(
    RawProps const &rawProps,
    ABI38_0_0YGStyle::Edges const &sourceValue,
    ABI38_0_0YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[ABI38_0_0YGEdgeLeft] = convertRawProp(
      rawProps, "left", sourceValue[ABI38_0_0YGEdgeLeft], defaultValue[ABI38_0_0YGEdgeLeft]);
  result[ABI38_0_0YGEdgeTop] = convertRawProp(
      rawProps, "top", sourceValue[ABI38_0_0YGEdgeTop], defaultValue[ABI38_0_0YGEdgeTop]);
  result[ABI38_0_0YGEdgeRight] = convertRawProp(
      rawProps, "right", sourceValue[ABI38_0_0YGEdgeRight], defaultValue[ABI38_0_0YGEdgeRight]);
  result[ABI38_0_0YGEdgeBottom] = convertRawProp(
      rawProps,
      "bottom",
      sourceValue[ABI38_0_0YGEdgeBottom],
      defaultValue[ABI38_0_0YGEdgeBottom]);
  result[ABI38_0_0YGEdgeStart] = convertRawProp(
      rawProps, "start", sourceValue[ABI38_0_0YGEdgeStart], defaultValue[ABI38_0_0YGEdgeStart]);
  result[ABI38_0_0YGEdgeEnd] = convertRawProp(
      rawProps, "end", sourceValue[ABI38_0_0YGEdgeEnd], defaultValue[ABI38_0_0YGEdgeEnd]);
  return result;
}

static inline ABI38_0_0YGStyle convertRawProp(
    RawProps const &rawProps,
    ABI38_0_0YGStyle const &sourceValue) {
  auto yogaStyle = ABI38_0_0YGStyle{};
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

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
