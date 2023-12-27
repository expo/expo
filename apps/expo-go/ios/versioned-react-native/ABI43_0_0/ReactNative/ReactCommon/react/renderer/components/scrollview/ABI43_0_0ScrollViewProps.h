/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/scrollview/primitives.h>
#include <ABI43_0_0React/ABI43_0_0renderer/components/view/ViewProps.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

// TODO (T28334063): Consider for codegen.
class ScrollViewProps final : public ViewProps {
 public:
  ScrollViewProps() = default;
  ScrollViewProps(ScrollViewProps const &sourceProps, RawProps const &rawProps);

#pragma mark - Props

  bool alwaysBounceHorizontal{};
  bool alwaysBounceVertical{};
  bool bounces{true};
  bool bouncesZoom{true};
  bool canCancelContentTouches{true};
  bool centerContent{};
  bool automaticallyAdjustContentInsets{};
  Float decelerationRate{0.998};
  bool directionalLockEnabled{};
  ScrollViewIndicatorStyle indicatorStyle{};
  ScrollViewKeyboardDismissMode keyboardDismissMode{};
  Float maximumZoomScale{1.0};
  Float minimumZoomScale{1.0};
  bool scrollEnabled{true};
  bool pagingEnabled{};
  bool pinchGestureEnabled{true};
  bool scrollsToTop{true};
  bool showsHorizontalScrollIndicator{true};
  bool showsVerticalScrollIndicator{true};
  Float scrollEventThrottle{};
  Float zoomScale{1.0};
  EdgeInsets contentInset{};
  Point contentOffset{};
  EdgeInsets scrollIndicatorInsets{};
  Float snapToInterval{};
  ScrollViewSnapToAlignment snapToAlignment{};
  bool disableIntervalMomentum{false};
  std::vector<Float> snapToOffsets{};
  bool snapToStart{true};
  bool snapToEnd{true};
  ContentInsetAdjustmentBehavior contentInsetAdjustmentBehavior{
      ContentInsetAdjustmentBehavior::Never};
  bool scrollToOverflowEnabled{false};

#pragma mark - DebugStringConvertible

#if ABI43_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
