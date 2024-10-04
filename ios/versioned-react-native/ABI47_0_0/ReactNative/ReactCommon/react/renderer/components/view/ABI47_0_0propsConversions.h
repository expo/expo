/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/components/view/conversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/PropsParserContext.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/propsConversions.h>

#include <optional>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

// Nearly this entire file can be deleted when iterator-style Prop parsing
// ships fully for View
static inline ABI47_0_0YGStyle::Dimensions convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *widthName,
    char const *heightName,
    ABI47_0_0YGStyle::Dimensions const &sourceValue,
    ABI47_0_0YGStyle::Dimensions const &defaultValue) {
  auto dimensions = defaultValue;
  dimensions[ABI47_0_0YGDimensionWidth] = convertRawProp(
      context,
      rawProps,
      widthName,
      sourceValue[ABI47_0_0YGDimensionWidth],
      defaultValue[ABI47_0_0YGDimensionWidth]);
  dimensions[ABI47_0_0YGDimensionHeight] = convertRawProp(
      context,
      rawProps,
      heightName,
      sourceValue[ABI47_0_0YGDimensionHeight],
      defaultValue[ABI47_0_0YGDimensionHeight]);
  return dimensions;
}

static inline ABI47_0_0YGStyle::Edges convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *prefix,
    char const *suffix,
    ABI47_0_0YGStyle::Edges const &sourceValue,
    ABI47_0_0YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[ABI47_0_0YGEdgeLeft] = convertRawProp(
      context,
      rawProps,
      "Left",
      sourceValue[ABI47_0_0YGEdgeLeft],
      defaultValue[ABI47_0_0YGEdgeLeft],
      prefix,
      suffix);
  result[ABI47_0_0YGEdgeTop] = convertRawProp(
      context,
      rawProps,
      "Top",
      sourceValue[ABI47_0_0YGEdgeTop],
      defaultValue[ABI47_0_0YGEdgeTop],
      prefix,
      suffix);
  result[ABI47_0_0YGEdgeRight] = convertRawProp(
      context,
      rawProps,
      "Right",
      sourceValue[ABI47_0_0YGEdgeRight],
      defaultValue[ABI47_0_0YGEdgeRight],
      prefix,
      suffix);
  result[ABI47_0_0YGEdgeBottom] = convertRawProp(
      context,
      rawProps,
      "Bottom",
      sourceValue[ABI47_0_0YGEdgeBottom],
      defaultValue[ABI47_0_0YGEdgeBottom],
      prefix,
      suffix);
  result[ABI47_0_0YGEdgeStart] = convertRawProp(
      context,
      rawProps,
      "Start",
      sourceValue[ABI47_0_0YGEdgeStart],
      defaultValue[ABI47_0_0YGEdgeStart],
      prefix,
      suffix);
  result[ABI47_0_0YGEdgeEnd] = convertRawProp(
      context,
      rawProps,
      "End",
      sourceValue[ABI47_0_0YGEdgeEnd],
      defaultValue[ABI47_0_0YGEdgeEnd],
      prefix,
      suffix);
  result[ABI47_0_0YGEdgeHorizontal] = convertRawProp(
      context,
      rawProps,
      "Horizontal",
      sourceValue[ABI47_0_0YGEdgeHorizontal],
      defaultValue[ABI47_0_0YGEdgeHorizontal],
      prefix,
      suffix);
  result[ABI47_0_0YGEdgeVertical] = convertRawProp(
      context,
      rawProps,
      "Vertical",
      sourceValue[ABI47_0_0YGEdgeVertical],
      defaultValue[ABI47_0_0YGEdgeVertical],
      prefix,
      suffix);
  result[ABI47_0_0YGEdgeAll] = convertRawProp(
      context,
      rawProps,
      "",
      sourceValue[ABI47_0_0YGEdgeAll],
      defaultValue[ABI47_0_0YGEdgeAll],
      prefix,
      suffix);
  return result;
}

static inline ABI47_0_0YGStyle::Edges convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    ABI47_0_0YGStyle::Edges const &sourceValue,
    ABI47_0_0YGStyle::Edges const &defaultValue) {
  auto result = defaultValue;
  result[ABI47_0_0YGEdgeLeft] = convertRawProp(
      context,
      rawProps,
      "left",
      sourceValue[ABI47_0_0YGEdgeLeft],
      defaultValue[ABI47_0_0YGEdgeLeft]);
  result[ABI47_0_0YGEdgeTop] = convertRawProp(
      context,
      rawProps,
      "top",
      sourceValue[ABI47_0_0YGEdgeTop],
      defaultValue[ABI47_0_0YGEdgeTop]);
  result[ABI47_0_0YGEdgeRight] = convertRawProp(
      context,
      rawProps,
      "right",
      sourceValue[ABI47_0_0YGEdgeRight],
      defaultValue[ABI47_0_0YGEdgeRight]);
  result[ABI47_0_0YGEdgeBottom] = convertRawProp(
      context,
      rawProps,
      "bottom",
      sourceValue[ABI47_0_0YGEdgeBottom],
      defaultValue[ABI47_0_0YGEdgeBottom]);
  result[ABI47_0_0YGEdgeStart] = convertRawProp(
      context,
      rawProps,
      "start",
      sourceValue[ABI47_0_0YGEdgeStart],
      defaultValue[ABI47_0_0YGEdgeStart]);
  result[ABI47_0_0YGEdgeEnd] = convertRawProp(
      context,
      rawProps,
      "end",
      sourceValue[ABI47_0_0YGEdgeEnd],
      defaultValue[ABI47_0_0YGEdgeEnd]);
  return result;
}

static inline ABI47_0_0YGStyle convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    ABI47_0_0YGStyle const &sourceValue) {
  auto yogaStyle = ABI47_0_0YGStyle{};
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

// This can be deleted when non-iterator ViewProp parsing is deleted
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

// This can be deleted when non-iterator ViewProp parsing is deleted
static inline ViewEvents convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    ViewEvents const &sourceValue,
    ViewEvents const &defaultValue) {
  ViewEvents result{};
  using Offset = ViewEvents::Offset;

  result[Offset::PointerEnter] = convertRawProp(
      context,
      rawProps,
      "onPointerEnter",
      sourceValue[Offset::PointerEnter],
      defaultValue[Offset::PointerEnter]);
  result[Offset::PointerMove] = convertRawProp(
      context,
      rawProps,
      "onPointerMove",
      sourceValue[Offset::PointerMove],
      defaultValue[Offset::PointerMove]);
  result[Offset::PointerLeave] = convertRawProp(
      context,
      rawProps,
      "onPointerLeave",
      sourceValue[Offset::PointerLeave],
      defaultValue[Offset::PointerLeave]);

  // Experimental W3C Pointer callbacks
  result[Offset::PointerEnterCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerEnterCapture",
      sourceValue[Offset::PointerEnterCapture],
      defaultValue[Offset::PointerEnterCapture]);
  result[Offset::PointerMoveCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerMoveCapture",
      sourceValue[Offset::PointerMoveCapture],
      defaultValue[Offset::PointerMoveCapture]);
  result[Offset::PointerLeaveCapture] = convertRawProp(
      context,
      rawProps,
      "onPointerLeaveCapture",
      sourceValue[Offset::PointerLeaveCapture],
      defaultValue[Offset::PointerLeaveCapture]);
  result[Offset::PointerOver] = convertRawProp(
      context,
      rawProps,
      "onPointerOver",
      sourceValue[Offset::PointerOver],
      defaultValue[Offset::PointerOver]);
  result[Offset::PointerOut] = convertRawProp(
      context,
      rawProps,
      "onPointerOut",
      sourceValue[Offset::PointerOut],
      defaultValue[Offset::PointerOut]);

  // PanResponder callbacks
  result[Offset::MoveShouldSetResponder] = convertRawProp(
      context,
      rawProps,
      "onMoveShouldSetResponder",
      sourceValue[Offset::MoveShouldSetResponder],
      defaultValue[Offset::MoveShouldSetResponder]);
  result[Offset::MoveShouldSetResponderCapture] = convertRawProp(
      context,
      rawProps,
      "onMoveShouldSetResponderCapture",
      sourceValue[Offset::MoveShouldSetResponderCapture],
      defaultValue[Offset::MoveShouldSetResponderCapture]);
  result[Offset::StartShouldSetResponder] = convertRawProp(
      context,
      rawProps,
      "onStartShouldSetResponder",
      sourceValue[Offset::StartShouldSetResponder],
      defaultValue[Offset::StartShouldSetResponder]);
  result[Offset::StartShouldSetResponderCapture] = convertRawProp(
      context,
      rawProps,
      "onStartShouldSetResponderCapture",
      sourceValue[Offset::StartShouldSetResponderCapture],
      defaultValue[Offset::StartShouldSetResponderCapture]);
  result[Offset::ResponderGrant] = convertRawProp(
      context,
      rawProps,
      "onResponderGrant",
      sourceValue[Offset::ResponderGrant],
      defaultValue[Offset::ResponderGrant]);
  result[Offset::ResponderReject] = convertRawProp(
      context,
      rawProps,
      "onResponderReject",
      sourceValue[Offset::ResponderReject],
      defaultValue[Offset::ResponderReject]);
  result[Offset::ResponderStart] = convertRawProp(
      context,
      rawProps,
      "onResponderStart",
      sourceValue[Offset::ResponderStart],
      defaultValue[Offset::ResponderStart]);
  result[Offset::ResponderEnd] = convertRawProp(
      context,
      rawProps,
      "onResponderEnd",
      sourceValue[Offset::ResponderEnd],
      defaultValue[Offset::ResponderEnd]);
  result[Offset::ResponderRelease] = convertRawProp(
      context,
      rawProps,
      "onResponderRelease",
      sourceValue[Offset::ResponderRelease],
      defaultValue[Offset::ResponderRelease]);
  result[Offset::ResponderMove] = convertRawProp(
      context,
      rawProps,
      "onResponderMove",
      sourceValue[Offset::ResponderMove],
      defaultValue[Offset::ResponderMove]);
  result[Offset::ResponderTerminate] = convertRawProp(
      context,
      rawProps,
      "onResponderTerminate",
      sourceValue[Offset::ResponderTerminate],
      defaultValue[Offset::ResponderTerminate]);
  result[Offset::ResponderTerminationRequest] = convertRawProp(
      context,
      rawProps,
      "onResponderTerminationRequest",
      sourceValue[Offset::ResponderTerminationRequest],
      defaultValue[Offset::ResponderTerminationRequest]);
  result[Offset::ShouldBlockNativeResponder] = convertRawProp(
      context,
      rawProps,
      "onShouldBlockNativeResponder",
      sourceValue[Offset::ShouldBlockNativeResponder],
      defaultValue[Offset::ShouldBlockNativeResponder]);

  // Touch events
  result[Offset::TouchStart] = convertRawProp(
      context,
      rawProps,
      "onTouchStart",
      sourceValue[Offset::TouchStart],
      defaultValue[Offset::TouchStart]);
  result[Offset::TouchMove] = convertRawProp(
      context,
      rawProps,
      "onTouchMove",
      sourceValue[Offset::TouchMove],
      defaultValue[Offset::TouchMove]);
  result[Offset::TouchEnd] = convertRawProp(
      context,
      rawProps,
      "onTouchEnd",
      sourceValue[Offset::TouchEnd],
      defaultValue[Offset::TouchEnd]);
  result[Offset::TouchCancel] = convertRawProp(
      context,
      rawProps,
      "onTouchCancel",
      sourceValue[Offset::TouchCancel],
      defaultValue[Offset::TouchCancel]);

  return result;
}

#ifdef ANDROID

static inline void fromRawValue(
    const PropsParserContext &context,
    RawValue const &rawValue,
    NativeDrawable &result) {
  auto map = (butter::map<std::string, RawValue>)rawValue;

  auto typeIterator = map.find("type");
  ABI47_0_0React_native_assert(
      typeIterator != map.end() && typeIterator->second.hasType<std::string>());
  std::string type = (std::string)typeIterator->second;

  if (type == "ThemeAttrAndroid") {
    auto attrIterator = map.find("attribute");
    ABI47_0_0React_native_assert(
        attrIterator != map.end() &&
        attrIterator->second.hasType<std::string>());

    result = NativeDrawable{
        .kind = NativeDrawable::Kind::ThemeAttr,
        .themeAttr = (std::string)attrIterator->second,
    };
  } else if (type == "RippleAndroid") {
    auto color = map.find("color");
    auto borderless = map.find("borderless");
    auto rippleRadius = map.find("rippleRadius");

    result = NativeDrawable{
        .kind = NativeDrawable::Kind::Ripple,
        .ripple =
            NativeDrawable::Ripple{
                .color = color != map.end() && color->second.hasType<int32_t>()
                    ? (int32_t)color->second
                    : std::optional<int32_t>{},
                .borderless = borderless != map.end() &&
                        borderless->second.hasType<bool>()
                    ? (bool)borderless->second
                    : false,
                .rippleRadius = rippleRadius != map.end() &&
                        rippleRadius->second.hasType<Float>()
                    ? (Float)rippleRadius->second
                    : std::optional<Float>{},
            },
    };
  } else {
    LOG(ERROR) << "Unknown native drawable type: " << type;
    ABI47_0_0React_native_assert(false);
  }
}

#endif

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
