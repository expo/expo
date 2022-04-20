/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0ViewProps.h"

#include <algorithm>

#include <ABI45_0_0React/ABI45_0_0renderer/components/view/conversions.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/propsConversions.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/propsConversions.h>
#include <ABI45_0_0React/ABI45_0_0renderer/debug/debugStringConvertibleUtils.h>
#include <ABI45_0_0React/ABI45_0_0renderer/graphics/conversions.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

ViewProps::ViewProps(
    const PropsParserContext &context,
    ViewProps const &sourceProps,
    RawProps const &rawProps)
    : YogaStylableProps(context, sourceProps, rawProps),
      AccessibilityProps(context, sourceProps, rawProps),
      opacity(convertRawProp(
          context,
          rawProps,
          "opacity",
          sourceProps.opacity,
          (Float)1.0)),
      foregroundColor(convertRawProp(
          context,
          rawProps,
          "foregroundColor",
          sourceProps.foregroundColor,
          {})),
      backgroundColor(convertRawProp(
          context,
          rawProps,
          "backgroundColor",
          sourceProps.backgroundColor,
          {})),
      borderRadii(convertRawProp(
          context,
          rawProps,
          "border",
          "Radius",
          sourceProps.borderRadii,
          {})),
      borderColors(convertRawProp(
          context,
          rawProps,
          "border",
          "Color",
          sourceProps.borderColors,
          {})),
      borderStyles(convertRawProp(
          context,
          rawProps,
          "border",
          "Style",
          sourceProps.borderStyles,
          {})),
      shadowColor(convertRawProp(
          context,
          rawProps,
          "shadowColor",
          sourceProps.shadowColor,
          {})),
      shadowOffset(convertRawProp(
          context,
          rawProps,
          "shadowOffset",
          sourceProps.shadowOffset,
          {})),
      shadowOpacity(convertRawProp(
          context,
          rawProps,
          "shadowOpacity",
          sourceProps.shadowOpacity,
          {})),
      shadowRadius(convertRawProp(
          context,
          rawProps,
          "shadowRadius",
          sourceProps.shadowRadius,
          {})),
      transform(convertRawProp(
          context,
          rawProps,
          "transform",
          sourceProps.transform,
          {})),
      backfaceVisibility(convertRawProp(
          context,
          rawProps,
          "backfaceVisibility",
          sourceProps.backfaceVisibility,
          {})),
      shouldRasterize(convertRawProp(
          context,
          rawProps,
          "shouldRasterize",
          sourceProps.shouldRasterize,
          {})),
      zIndex(
          convertRawProp(context, rawProps, "zIndex", sourceProps.zIndex, {})),
      pointerEvents(convertRawProp(
          context,
          rawProps,
          "pointerEvents",
          sourceProps.pointerEvents,
          {})),
      hitSlop(convertRawProp(
          context,
          rawProps,
          "hitSlop",
          sourceProps.hitSlop,
          {})),
      onLayout(convertRawProp(
          context,
          rawProps,
          "onLayout",
          sourceProps.onLayout,
          {})),
      pointerEnter(convertRawProp(
          context,
          rawProps,
          "pointerenter",
          sourceProps.pointerEnter,
          {})),
      pointerLeave(convertRawProp(
          context,
          rawProps,
          "pointerleave",
          sourceProps.pointerLeave,
          {})),
      pointerMove(convertRawProp(
          context,
          rawProps,
          "pointermove",
          sourceProps.pointerMove,
          {})),
      collapsable(convertRawProp(
          context,
          rawProps,
          "collapsable",
          sourceProps.collapsable,
          true)),
      removeClippedSubviews(convertRawProp(
          context,
          rawProps,
          "removeClippedSubviews",
          sourceProps.removeClippedSubviews,
          false)),
      elevation(convertRawProp(
          context,
          rawProps,
          "elevation",
          sourceProps.elevation,
          {})){};

#pragma mark - Convenience Methods

static BorderRadii ensureNoOverlap(BorderRadii const &radii, Size const &size) {
  // "Corner curves must not overlap: When the sum of any two adjacent border
  // radii exceeds the size of the border box, UAs must proportionally reduce
  // the used values of all border radii until none of them overlap."
  // Source: https://www.w3.org/TR/css-backgrounds-3/#corner-overlap

  auto insets = EdgeInsets{
      /* .left = */ radii.topLeft + radii.bottomLeft,
      /* .top = */ radii.topLeft + radii.topRight,
      /* .right = */ radii.topRight + radii.bottomRight,
      /* .bottom = */ radii.bottomLeft + radii.bottomRight,
  };

  auto insetsScale = EdgeInsets{
      /* .left = */
      insets.left > 0 ? std::min((Float)1.0, size.height / insets.left) : 0,
      /* .top = */
      insets.top > 0 ? std::min((Float)1.0, size.width / insets.top) : 0,
      /* .right = */
      insets.right > 0 ? std::min((Float)1.0, size.height / insets.right) : 0,
      /* .bottom = */
      insets.bottom > 0 ? std::min((Float)1.0, size.width / insets.bottom) : 0,
  };

  return BorderRadii{
      /* topLeft = */
      radii.topLeft * std::min(insetsScale.top, insetsScale.left),
      /* topRight = */
      radii.topRight * std::min(insetsScale.top, insetsScale.right),
      /* bottomLeft = */
      radii.bottomLeft * std::min(insetsScale.bottom, insetsScale.left),
      /* bottomRight = */
      radii.bottomRight * std::min(insetsScale.bottom, insetsScale.right),
  };
}

BorderMetrics ViewProps::resolveBorderMetrics(
    LayoutMetrics const &layoutMetrics) const {
  auto isRTL =
      bool{layoutMetrics.layoutDirection == LayoutDirection::RightToLeft};

  auto borderWidths = CascadedBorderWidths{
      /* .left = */ optionalFloatFromYogaValue(yogaStyle.border()[ABI45_0_0YGEdgeLeft]),
      /* .top = */ optionalFloatFromYogaValue(yogaStyle.border()[ABI45_0_0YGEdgeTop]),
      /* .right = */
      optionalFloatFromYogaValue(yogaStyle.border()[ABI45_0_0YGEdgeRight]),
      /* .bottom = */
      optionalFloatFromYogaValue(yogaStyle.border()[ABI45_0_0YGEdgeBottom]),
      /* .start = */
      optionalFloatFromYogaValue(yogaStyle.border()[ABI45_0_0YGEdgeStart]),
      /* .end = */ optionalFloatFromYogaValue(yogaStyle.border()[ABI45_0_0YGEdgeEnd]),
      /* .horizontal = */
      optionalFloatFromYogaValue(yogaStyle.border()[ABI45_0_0YGEdgeHorizontal]),
      /* .vertical = */
      optionalFloatFromYogaValue(yogaStyle.border()[ABI45_0_0YGEdgeVertical]),
      /* .all = */ optionalFloatFromYogaValue(yogaStyle.border()[ABI45_0_0YGEdgeAll]),
  };

  return {
      /* .borderColors = */ borderColors.resolve(isRTL, {}),
      /* .borderWidths = */ borderWidths.resolve(isRTL, 0),
      /* .borderRadii = */
      ensureNoOverlap(borderRadii.resolve(isRTL, 0), layoutMetrics.frame.size),
      /* .borderStyles = */ borderStyles.resolve(isRTL, BorderStyle::Solid),
  };
}

bool ViewProps::getClipsContentToBounds() const {
  return yogaStyle.overflow() != ABI45_0_0YGOverflowVisible;
}

#ifdef ANDROID
bool ViewProps::getProbablyMoreHorizontalThanVertical_DEPRECATED() const {
  return yogaStyle.flexDirection() == ABI45_0_0YGFlexDirectionRow;
}
#endif

#pragma mark - DebugStringConvertible

#if ABI45_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ViewProps::getDebugProps() const {
  const auto &defaultViewProps = ViewProps();

  return AccessibilityProps::getDebugProps() +
      YogaStylableProps::getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem(
              "zIndex", zIndex, defaultViewProps.zIndex.value_or(0)),
          debugStringConvertibleItem(
              "opacity", opacity, defaultViewProps.opacity),
          debugStringConvertibleItem(
              "foregroundColor",
              foregroundColor,
              defaultViewProps.foregroundColor),
          debugStringConvertibleItem(
              "backgroundColor",
              backgroundColor,
              defaultViewProps.backgroundColor),
      };
}
#endif

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
