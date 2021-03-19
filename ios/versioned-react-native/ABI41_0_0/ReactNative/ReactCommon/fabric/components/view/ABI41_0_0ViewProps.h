/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/components/view/AccessibilityProps.h>
#include <ABI41_0_0React/components/view/YogaStylableProps.h>
#include <ABI41_0_0React/components/view/primitives.h>
#include <ABI41_0_0React/core/LayoutMetrics.h>
#include <ABI41_0_0React/core/Props.h>
#include <ABI41_0_0React/graphics/Color.h>
#include <ABI41_0_0React/graphics/Geometry.h>
#include <ABI41_0_0React/graphics/Transform.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

class ViewProps;

using SharedViewProps = std::shared_ptr<ViewProps const>;

class ViewProps : public YogaStylableProps, public AccessibilityProps {
 public:
  ViewProps() = default;
  ViewProps(ViewProps const &sourceProps, RawProps const &rawProps);

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
  Size shadowOffset{};
  Float shadowOpacity{};
  Float shadowRadius{};

  // Transform
  Transform transform{};
  BackfaceVisibility backfaceVisibility{};
  bool shouldRasterize{};
  int zIndex{};

  // Events
  PointerEventsMode pointerEvents{};
  EdgeInsets hitSlop{};
  bool onLayout{};

  bool collapsable{true};

#pragma mark - Convenience Methods

  BorderMetrics resolveBorderMetrics(LayoutMetrics const &layoutMetrics) const;
  bool getClipsContentToBounds() const;

#ifdef ANDROID
  bool getProbablyMoreHorizontalThanVertical_DEPRECATED() const;
#endif

#pragma mark - DebugStringConvertible

#if ABI41_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
