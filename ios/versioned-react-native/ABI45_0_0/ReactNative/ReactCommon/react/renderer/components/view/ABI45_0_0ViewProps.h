/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0React/ABI45_0_0renderer/components/view/AccessibilityProps.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/YogaStylableProps.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/primitives.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/LayoutMetrics.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/Props.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/PropsParserContext.h>
#include <ABI45_0_0React/ABI45_0_0renderer/graphics/Color.h>
#include <ABI45_0_0React/ABI45_0_0renderer/graphics/Geometry.h>
#include <ABI45_0_0React/ABI45_0_0renderer/graphics/Transform.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

class ViewProps;

using SharedViewProps = std::shared_ptr<ViewProps const>;

class ViewProps : public YogaStylableProps, public AccessibilityProps {
 public:
  ViewProps() = default;
  ViewProps(
      const PropsParserContext &context,
      ViewProps const &sourceProps,
      RawProps const &rawProps);

#pragma mark - Props

  // Color
  Float opacity{1.0};
  SharedColor foregroundColor{};
  SharedColor backgroundColor{};

  // Borders
  CascadedBorderRadii borderRadii{};
  CascadedBorderColors borderColors{};
  CascadedBorderStyles borderStyles{};

  // Shadow
  SharedColor shadowColor{};
  Size shadowOffset{0, -3};
  Float shadowOpacity{};
  Float shadowRadius{3};

  // Transform
  Transform transform{};
  BackfaceVisibility backfaceVisibility{};
  bool shouldRasterize{};
  butter::optional<int> zIndex{};

  // Events
  PointerEventsMode pointerEvents{};
  EdgeInsets hitSlop{};
  bool onLayout{};

  bool pointerEnter{};

  bool pointerLeave{};

  bool pointerMove{};

  bool collapsable{true};

  bool removeClippedSubviews{false};

  Float elevation{}; /* Android-only */

#pragma mark - Convenience Methods

  BorderMetrics resolveBorderMetrics(LayoutMetrics const &layoutMetrics) const;
  bool getClipsContentToBounds() const;

#ifdef ANDROID
  bool getProbablyMoreHorizontalThanVertical_DEPRECATED() const;
#endif

#pragma mark - DebugStringConvertible

#if ABI45_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
