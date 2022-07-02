/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0React/ABI45_0_0renderer/components/view/conversions.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/PropsParserContext.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/propsConversions.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

static inline ABI45_0_0YGStyle::Dimensions convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *widthName,
    char const *heightName,
    ABI45_0_0YGStyle::Dimensions const &sourceValue,
    ABI45_0_0YGStyle::Dimensions const &defaultValue) {
  auto dimensions = defaultValue;
  dimensions[ABI45_0_0YGDimensionWidth] = convertRawProp(
      context,
      rawProps,
      widthName,
      sourceValue[ABI45_0_0YGDimensionWidth],
      defaultValue[ABI45_0_0YGDimensionWidth]);
  dimensions[ABI45_0_0YGDimensionHeight] = convertRawProp(
      context,
      rawProps,
      heightName,
      sourceValue[ABI45_0_0YGDimensionHeight],
      defaultValue[ABI45_0_0YGDimensionWidth]);
  return dimensions;
}

static inline ABI45_0_0YGStyle::Edges convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    ABI45_0_0YGStyle::Edges const &sourceValue,
    ABI45_0_0YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[ABI45_0_0YGEdgeLeft] = convertRawProp(
      context,
      rawProps,
      "Left",
      sourceValue[ABI45_0_0YGEdgeLeft],
      defaultValue[ABI45_0_0YGEdgeLeft],
      prefix,
      suffix);
  result[ABI45_0_0YGEdgeTop] = convertRawProp(
      context,
      rawProps,
      "Top",
      sourceValue[ABI45_0_0YGEdgeTop],
      defaultValue[ABI45_0_0YGEdgeTop],
      prefix,
      suffix);
  result[ABI45_0_0YGEdgeRight] = convertRawProp(
      context,
      rawProps,
      "Right",
      sourceValue[ABI45_0_0YGEdgeRight],
      defaultValue[ABI45_0_0YGEdgeRight],
      prefix,
      suffix);
  result[ABI45_0_0YGEdgeBottom] = convertRawProp(
      context,
      rawProps,
      "Bottom",
      sourceValue[ABI45_0_0YGEdgeBottom],
      defaultValue[ABI45_0_0YGEdgeBottom],
      prefix,
      suffix);
  result[ABI45_0_0YGEdgeStart] = convertRawProp(
      context,
      rawProps,
      "Start",
      sourceValue[ABI45_0_0YGEdgeStart],
      defaultValue[ABI45_0_0YGEdgeStart],
      prefix,
      suffix);
  result[ABI45_0_0YGEdgeEnd] = convertRawProp(
      context,
      rawProps,
      "End",
      sourceValue[ABI45_0_0YGEdgeEnd],
      defaultValue[ABI45_0_0YGEdgeEnd],
      prefix,
      suffix);
  result[ABI45_0_0YGEdgeHorizontal] = convertRawProp(
      context,
      rawProps,
      "Horizontal",
      sourceValue[ABI45_0_0YGEdgeHorizontal],
      defaultValue[ABI45_0_0YGEdgeHorizontal],
      prefix,
      suffix);
  result[ABI45_0_0YGEdgeVertical] = convertRawProp(
      context,
      rawProps,
      "Vertical",
      sourceValue[ABI45_0_0YGEdgeVertical],
      defaultValue[ABI45_0_0YGEdgeVertical],
      prefix,
      suffix);
  result[ABI45_0_0YGEdgeAll] = convertRawProp(
      context,
      rawProps,
      "",
      sourceValue[ABI45_0_0YGEdgeAll],
      defaultValue[ABI45_0_0YGEdgeAll],
      prefix,
      suffix);
  return result;
}

static inline ABI45_0_0YGStyle::Edges convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    ABI45_0_0YGStyle::Edges const &sourceValue,
    ABI45_0_0YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[ABI45_0_0YGEdgeLeft] = convertRawProp(
      context,
      rawProps,
      "left",
      sourceValue[ABI45_0_0YGEdgeLeft],
      defaultValue[ABI45_0_0YGEdgeLeft]);
  result[ABI45_0_0YGEdgeTop] = convertRawProp(
      context,
      rawProps,
      "top",
      sourceValue[ABI45_0_0YGEdgeTop],
      defaultValue[ABI45_0_0YGEdgeTop]);
  result[ABI45_0_0YGEdgeRight] = convertRawProp(
      context,
      rawProps,
      "right",
      sourceValue[ABI45_0_0YGEdgeRight],
      defaultValue[ABI45_0_0YGEdgeRight]);
  result[ABI45_0_0YGEdgeBottom] = convertRawProp(
      context,
      rawProps,
      "bottom",
      sourceValue[ABI45_0_0YGEdgeBottom],
      defaultValue[ABI45_0_0YGEdgeBottom]);
  result[ABI45_0_0YGEdgeStart] = convertRawProp(
      context,
      rawProps,
      "start",
      sourceValue[ABI45_0_0YGEdgeStart],
      defaultValue[ABI45_0_0YGEdgeStart]);
  result[ABI45_0_0YGEdgeEnd] = convertRawProp(
      context,
      rawProps,
      "end",
      sourceValue[ABI45_0_0YGEdgeEnd],
      defaultValue[ABI45_0_0YGEdgeEnd]);
  return result;
}

static inline ABI45_0_0YGStyle convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    ABI45_0_0YGStyle const &sourceValue) {
  auto yogaStyle = ABI45_0_0YGStyle{};
  yogaStyle.direction() = convertRawProp(
      context,
      rawProps,
      "direction",
      sourceValue.direction(),
      yogaStyle.direction());
  yogaStyle.flexDirection() = convertRawProp(
      context,
      rawProps,
      "flexDirection",
      sourceValue.flexDirection(),
      yogaStyle.flexDirection());
  yogaStyle.justifyContent() = convertRawProp(
      context,
      rawProps,
      "justifyContent",
      sourceValue.justifyContent(),
      yogaStyle.justifyContent());
  yogaStyle.alignContent() = convertRawProp(
      context,
      rawProps,
      "alignContent",
      sourceValue.alignContent(),
      yogaStyle.alignContent());
  yogaStyle.alignItems() = convertRawProp(
      context,
      rawProps,
      "alignItems",
      sourceValue.alignItems(),
      yogaStyle.alignItems());
  yogaStyle.alignSelf() = convertRawProp(
      context,
      rawProps,
      "alignSelf",
      sourceValue.alignSelf(),
      yogaStyle.alignSelf());
  yogaStyle.positionType() = convertRawProp(
      context,
      rawProps,
      "position",
      sourceValue.positionType(),
      yogaStyle.positionType());
  yogaStyle.flexWrap() = convertRawProp(
      context,
      rawProps,
      "flexWrap",
      sourceValue.flexWrap(),
      yogaStyle.flexWrap());
  yogaStyle.overflow() = convertRawProp(
      context,
      rawProps,
      "overflow",
      sourceValue.overflow(),
      yogaStyle.overflow());
  yogaStyle.display() = convertRawProp(
      context, rawProps, "display", sourceValue.display(), yogaStyle.display());
  yogaStyle.flex() = convertRawProp(
      context, rawProps, "flex", sourceValue.flex(), yogaStyle.flex());
  yogaStyle.flexGrow() = convertRawProp(
      context,
      rawProps,
      "flexGrow",
      sourceValue.flexGrow(),
      yogaStyle.flexGrow());
  yogaStyle.flexShrink() = convertRawProp(
      context,
      rawProps,
      "flexShrink",
      sourceValue.flexShrink(),
      yogaStyle.flexShrink());
  yogaStyle.flexBasis() = convertRawProp(
      context,
      rawProps,
      "flexBasis",
      sourceValue.flexBasis(),
      yogaStyle.flexBasis());
  yogaStyle.margin() = convertRawProp(
      context,
      rawProps,
      "margin",
      "",
      sourceValue.margin(),
      yogaStyle.margin());
  yogaStyle.position() = convertRawProp(
      context, rawProps, sourceValue.position(), yogaStyle.position());
  yogaStyle.padding() = convertRawProp(
      context,
      rawProps,
      "padding",
      "",
      sourceValue.padding(),
      yogaStyle.padding());
  yogaStyle.border() = convertRawProp(
      context,
      rawProps,
      "border",
      "Width",
      sourceValue.border(),
      yogaStyle.border());
  yogaStyle.dimensions() = convertRawProp(
      context,
      rawProps,
      "width",
      "height",
      sourceValue.dimensions(),
      yogaStyle.dimensions());
  yogaStyle.minDimensions() = convertRawProp(
      context,
      rawProps,
      "minWidth",
      "minHeight",
      sourceValue.minDimensions(),
      yogaStyle.minDimensions());
  yogaStyle.maxDimensions() = convertRawProp(
      context,
      rawProps,
      "maxWidth",
      "maxHeight",
      sourceValue.maxDimensions(),
      yogaStyle.maxDimensions());
  yogaStyle.aspectRatio() = convertRawProp(
      context,
      rawProps,
      "aspectRatio",
      sourceValue.aspectRatio(),
      yogaStyle.aspectRatio());
  return yogaStyle;
}

template <typename T>
static inline CascadedRectangleCorners<T> convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    CascadedRectangleCorners<T> const &sourceValue,
    CascadedRectangleCorners<T> const &defaultValue) {
  CascadedRectangleCorners<T> result;

  result.topLeft = convertRawProp(
      context,
      rawProps,
      "TopLeft",
      sourceValue.topLeft,
      defaultValue.topLeft,
      prefix,
      suffix);
  result.topRight = convertRawProp(
      context,
      rawProps,
      "TopRight",
      sourceValue.topRight,
      defaultValue.topRight,
      prefix,
      suffix);
  result.bottomLeft = convertRawProp(
      context,
      rawProps,
      "BottomLeft",
      sourceValue.bottomLeft,
      defaultValue.bottomLeft,
      prefix,
      suffix);
  result.bottomRight = convertRawProp(
      context,
      rawProps,
      "BottomRight",
      sourceValue.bottomRight,
      defaultValue.bottomRight,
      prefix,
      suffix);

  result.topStart = convertRawProp(
      context,
      rawProps,
      "TopStart",
      sourceValue.topStart,
      defaultValue.topStart,
      prefix,
      suffix);
  result.topEnd = convertRawProp(
      context,
      rawProps,
      "TopEnd",
      sourceValue.topEnd,
      defaultValue.topEnd,
      prefix,
      suffix);
  result.bottomStart = convertRawProp(
      context,
      rawProps,
      "BottomStart",
      sourceValue.bottomStart,
      defaultValue.bottomStart,
      prefix,
      suffix);
  result.bottomEnd = convertRawProp(
      context,
      rawProps,
      "BottomEnd",
      sourceValue.bottomEnd,
      defaultValue.bottomEnd,
      prefix,
      suffix);

  result.all = convertRawProp(
      context, rawProps, "", sourceValue.all, defaultValue.all, prefix, suffix);

  return result;
}

template <typename T>
static inline CascadedRectangleEdges<T> convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    CascadedRectangleEdges<T> const &sourceValue,
    CascadedRectangleEdges<T> const &defaultValue) {
  CascadedRectangleEdges<T> result;

  result.left = convertRawProp(
      context,
      rawProps,
      "Left",
      sourceValue.left,
      defaultValue.left,
      prefix,
      suffix);
  result.right = convertRawProp(
      context,
      rawProps,
      "Right",
      sourceValue.right,
      defaultValue.right,
      prefix,
      suffix);
  result.top = convertRawProp(
      context,
      rawProps,
      "Top",
      sourceValue.top,
      defaultValue.top,
      prefix,
      suffix);
  result.bottom = convertRawProp(
      context,
      rawProps,
      "Bottom",
      sourceValue.bottom,
      defaultValue.bottom,
      prefix,
      suffix);

  result.start = convertRawProp(
      context,
      rawProps,
      "Start",
      sourceValue.start,
      defaultValue.start,
      prefix,
      suffix);
  result.end = convertRawProp(
      context,
      rawProps,
      "End",
      sourceValue.end,
      defaultValue.end,
      prefix,
      suffix);
  result.horizontal = convertRawProp(
      context,
      rawProps,
      "Horizontal",
      sourceValue.horizontal,
      defaultValue.horizontal,
      prefix,
      suffix);
  result.vertical = convertRawProp(
      context,
      rawProps,
      "Vertical",
      sourceValue.vertical,
      defaultValue.vertical,
      prefix,
      suffix);

  result.all = convertRawProp(
      context, rawProps, "", sourceValue.all, defaultValue.all, prefix, suffix);

  return result;
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
