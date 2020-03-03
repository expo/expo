/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI37_0_0React/components/view/AccessibilityProps.h>
#include <ABI37_0_0React/components/view/YogaStylableProps.h>
#include <ABI37_0_0React/components/view/primitives.h>
#include <ABI37_0_0React/core/LayoutMetrics.h>
#include <ABI37_0_0React/core/Props.h>
#include <ABI37_0_0React/graphics/Color.h>
#include <ABI37_0_0React/graphics/Geometry.h>
#include <ABI37_0_0React/graphics/Transform.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class ViewProps;

using SharedViewProps = std::shared_ptr<ViewProps const>;

class ViewProps : public Props,
                  public YogaStylableProps,
                  public AccessibilityProps {
 public:
  ViewProps() = default;
  ViewProps(ABI37_0_0YGStyle const &yogaStyle);
  ViewProps(ViewProps const &sourceProps, RawProps const &rawProps);

#pragma mark - Props

  // Color
  Float const opacity{1.0};
  SharedColor const foregroundColor{};
  SharedColor const backgroundColor{};

  // Borders
  CascadedBorderRadii const borderRadii{};
  CascadedBorderColors const borderColors{};
  CascadedBorderStyles const borderStyles{};

  // Shadow
  SharedColor const shadowColor{};
  Size const shadowOffset{};
  Float const shadowOpacity{};
  Float const shadowRadius{};

  // Transform
  Transform transform{};
  BackfaceVisibility const backfaceVisibility{};
  bool const shouldRasterize{};
  int const zIndex{};

  // Events
  PointerEventsMode const pointerEvents{};
  EdgeInsets const hitSlop{};
  bool const onLayout{};

  bool const collapsable{true};

#pragma mark - Convenience Methods

  BorderMetrics resolveBorderMetrics(LayoutMetrics const &layoutMetrics) const;
  bool getClipsContentToBounds() const;

#ifdef ANDROID
  bool getProbablyMoreHorizontalThanVertical_DEPRECATED() const;
#endif

#pragma mark - DebugStringConvertible

#if ABI37_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
