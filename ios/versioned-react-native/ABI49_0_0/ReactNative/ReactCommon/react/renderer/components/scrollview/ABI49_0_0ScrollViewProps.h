/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/scrollview/primitives.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewProps.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>

#include <optional>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

// TODO (T28334063): Consider for codegen.
class ScrollViewProps final : public ViewProps {
 public:
  ScrollViewProps() = default;
  ScrollViewProps(
      const PropsParserContext &context,
      ScrollViewProps const &sourceProps,
      RawProps const &rawProps);

  void setProp(
      const PropsParserContext &context,
      RawPropsPropNameHash hash,
      const char *propName,
      RawValue const &value);

#pragma mark - Props

  bool alwaysBounceHorizontal{};
  bool alwaysBounceVertical{};
  bool bounces{true};
  bool bouncesZoom{true};
  bool canCancelContentTouches{true};
  bool centerContent{};
  bool automaticallyAdjustContentInsets{};
  bool automaticallyAdjustsScrollIndicatorInsets{true};
  Float decelerationRate{0.998f};
  bool directionalLockEnabled{};
  ScrollViewIndicatorStyle indicatorStyle{};
  ScrollViewKeyboardDismissMode keyboardDismissMode{};
  std::optional<ScrollViewMaintainVisibleContentPosition>
      maintainVisibleContentPosition{};
  Float maximumZoomScale{1.0f};
  Float minimumZoomScale{1.0f};
  bool scrollEnabled{true};
  bool pagingEnabled{};
  bool pinchGestureEnabled{true};
  bool scrollsToTop{true};
  bool showsHorizontalScrollIndicator{true};
  bool showsVerticalScrollIndicator{true};
  Float scrollEventThrottle{};
  Float zoomScale{1.0f};
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
  bool isInvertedVirtualizedList{false};

#pragma mark - DebugStringConvertible

#if ABI49_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
