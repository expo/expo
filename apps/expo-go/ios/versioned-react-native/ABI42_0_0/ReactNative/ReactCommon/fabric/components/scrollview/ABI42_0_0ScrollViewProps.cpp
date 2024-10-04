/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0ScrollViewProps.h"

#include <ABI42_0_0React/components/scrollview/conversions.h>
#include <ABI42_0_0React/debug/debugStringConvertibleUtils.h>
#include <ABI42_0_0React/graphics/conversions.h>

#include <ABI42_0_0React/core/propsConversions.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

ScrollViewProps::ScrollViewProps(
    const ScrollViewProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      alwaysBounceHorizontal(convertRawProp(
          rawProps,
          "alwaysBounceHorizontal",
          sourceProps.alwaysBounceHorizontal,
          {})),
      alwaysBounceVertical(convertRawProp(
          rawProps,
          "alwaysBounceVertical",
          sourceProps.alwaysBounceVertical,
          {})),
      bounces(convertRawProp(rawProps, "bounces", sourceProps.bounces, true)),
      bouncesZoom(convertRawProp(
          rawProps,
          "bouncesZoom",
          sourceProps.bouncesZoom,
          true)),
      canCancelContentTouches(convertRawProp(
          rawProps,
          "canCancelContentTouches",
          sourceProps.canCancelContentTouches,
          true)),
      centerContent(convertRawProp(
          rawProps,
          "centerContent",
          sourceProps.centerContent,
          {})),
      automaticallyAdjustContentInsets(convertRawProp(
          rawProps,
          "automaticallyAdjustContentInsets",
          sourceProps.automaticallyAdjustContentInsets,
          {})),
      decelerationRate(convertRawProp(
          rawProps,
          "decelerationRate",
          sourceProps.decelerationRate,
          (Float)0.998)),
      directionalLockEnabled(convertRawProp(
          rawProps,
          "directionalLockEnabled",
          sourceProps.directionalLockEnabled,
          {})),
      indicatorStyle(convertRawProp(
          rawProps,
          "indicatorStyle",
          sourceProps.indicatorStyle,
          {})),
      keyboardDismissMode(convertRawProp(
          rawProps,
          "keyboardDismissMode",
          sourceProps.keyboardDismissMode,
          {})),
      maximumZoomScale(convertRawProp(
          rawProps,
          "maximumZoomScale",
          sourceProps.maximumZoomScale,
          (Float)1.0)),
      minimumZoomScale(convertRawProp(
          rawProps,
          "minimumZoomScale",
          sourceProps.minimumZoomScale,
          (Float)1.0)),
      scrollEnabled(convertRawProp(
          rawProps,
          "scrollEnabled",
          sourceProps.scrollEnabled,
          true)),
      pagingEnabled(convertRawProp(
          rawProps,
          "pagingEnabled",
          sourceProps.pagingEnabled,
          {})),
      pinchGestureEnabled(convertRawProp(
          rawProps,
          "pinchGestureEnabled",
          sourceProps.pinchGestureEnabled,
          true)),
      scrollsToTop(convertRawProp(
          rawProps,
          "scrollsToTop",
          sourceProps.scrollsToTop,
          true)),
      showsHorizontalScrollIndicator(convertRawProp(
          rawProps,
          "showsHorizontalScrollIndicator",
          sourceProps.showsHorizontalScrollIndicator,
          true)),
      showsVerticalScrollIndicator(convertRawProp(
          rawProps,
          "showsVerticalScrollIndicator",
          sourceProps.showsVerticalScrollIndicator,
          true)),
      scrollEventThrottle(convertRawProp(
          rawProps,
          "scrollEventThrottle",
          sourceProps.scrollEventThrottle,
          {})),
      zoomScale(convertRawProp(
          rawProps,
          "zoomScale",
          sourceProps.zoomScale,
          (Float)1.0)),
      contentInset(convertRawProp(
          rawProps,
          "contentInset",
          sourceProps.contentInset,
          {})),
      scrollIndicatorInsets(convertRawProp(
          rawProps,
          "scrollIndicatorInsets",
          sourceProps.scrollIndicatorInsets,
          {})),
      snapToInterval(convertRawProp(
          rawProps,
          "snapToInterval",
          sourceProps.snapToInterval,
          {})),
      snapToAlignment(convertRawProp(
          rawProps,
          "snapToAlignment",
          sourceProps.snapToAlignment,
          {})) {}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ScrollViewProps::getDebugProps() const {
  auto defaultScrollViewProps = ScrollViewProps{};

  return ViewProps::getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem(
              "alwaysBounceHorizontal",
              alwaysBounceHorizontal,
              defaultScrollViewProps.alwaysBounceHorizontal),
          debugStringConvertibleItem(
              "alwaysBounceVertical",
              alwaysBounceVertical,
              defaultScrollViewProps.alwaysBounceVertical),
          debugStringConvertibleItem(
              "bounces", bounces, defaultScrollViewProps.bounces),
          debugStringConvertibleItem(
              "bouncesZoom", bouncesZoom, defaultScrollViewProps.bouncesZoom),
          debugStringConvertibleItem(
              "canCancelContentTouches",
              canCancelContentTouches,
              defaultScrollViewProps.canCancelContentTouches),
          debugStringConvertibleItem(
              "centerContent",
              centerContent,
              defaultScrollViewProps.centerContent),
          debugStringConvertibleItem(
              "automaticallyAdjustContentInsets",
              automaticallyAdjustContentInsets,
              defaultScrollViewProps.automaticallyAdjustContentInsets),
          debugStringConvertibleItem(
              "decelerationRate",
              decelerationRate,
              defaultScrollViewProps.decelerationRate),
          debugStringConvertibleItem(
              "directionalLockEnabled",
              directionalLockEnabled,
              defaultScrollViewProps.directionalLockEnabled),
          debugStringConvertibleItem(
              "indicatorStyle",
              indicatorStyle,
              defaultScrollViewProps.indicatorStyle),
          debugStringConvertibleItem(
              "keyboardDismissMode",
              keyboardDismissMode,
              defaultScrollViewProps.keyboardDismissMode),
          debugStringConvertibleItem(
              "maximumZoomScale",
              maximumZoomScale,
              defaultScrollViewProps.maximumZoomScale),
          debugStringConvertibleItem(
              "minimumZoomScale",
              minimumZoomScale,
              defaultScrollViewProps.minimumZoomScale),
          debugStringConvertibleItem(
              "scrollEnabled",
              scrollEnabled,
              defaultScrollViewProps.scrollEnabled),
          debugStringConvertibleItem(
              "pagingEnabled",
              pagingEnabled,
              defaultScrollViewProps.pagingEnabled),
          debugStringConvertibleItem(
              "pinchGestureEnabled",
              pinchGestureEnabled,
              defaultScrollViewProps.pinchGestureEnabled),
          debugStringConvertibleItem(
              "scrollsToTop",
              scrollsToTop,
              defaultScrollViewProps.scrollsToTop),
          debugStringConvertibleItem(
              "showsHorizontalScrollIndicator",
              showsHorizontalScrollIndicator,
              defaultScrollViewProps.showsHorizontalScrollIndicator),
          debugStringConvertibleItem(
              "showsVerticalScrollIndicator",
              showsVerticalScrollIndicator,
              defaultScrollViewProps.showsVerticalScrollIndicator),
          debugStringConvertibleItem(
              "scrollEventThrottle",
              scrollEventThrottle,
              defaultScrollViewProps.scrollEventThrottle),
          debugStringConvertibleItem(
              "zoomScale", zoomScale, defaultScrollViewProps.zoomScale),
          debugStringConvertibleItem(
              "contentInset",
              contentInset,
              defaultScrollViewProps.contentInset),
          debugStringConvertibleItem(
              "scrollIndicatorInsets",
              scrollIndicatorInsets,
              defaultScrollViewProps.scrollIndicatorInsets),
          debugStringConvertibleItem(
              "snapToInterval",
              snapToInterval,
              defaultScrollViewProps.snapToInterval),
          debugStringConvertibleItem(
              "snapToAlignment",
              snapToAlignment,
              defaultScrollViewProps.snapToAlignment),
      };
}
#endif

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
