/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/view/AccessibilityProps.h>
#include <ReactABI34_0_0/components/view/YogaStylableProps.h>
#include <ReactABI34_0_0/components/view/primitives.h>
#include <ReactABI34_0_0/core/Props.h>
#include <ReactABI34_0_0/graphics/Color.h>
#include <ReactABI34_0_0/graphics/Geometry.h>

namespace facebook {
namespace ReactABI34_0_0 {

class ViewProps;

using SharedViewProps = std::shared_ptr<const ViewProps>;

class ViewProps : public Props,
                  public YogaStylableProps,
                  public AccessibilityProps {
 public:
  ViewProps() = default;
  ViewProps(const ABI34_0_0YGStyle &ABI34_0_0yogaStyle);
  ViewProps(const ViewProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  // Color
  const Float opacity{1.0};
  const SharedColor foregroundColor{};
  const SharedColor backgroundColor{};

  // Borders
  const CascadedBorderRadii borderRadii{};
  const CascadedBorderColors borderColors{};
  const CascadedBorderStyles borderStyles{};

  // Shadow
  const SharedColor shadowColor{};
  const Size shadowOffset{};
  const Float shadowOpacity{};
  const Float shadowRadius{};

  // Transform
  const Transform transform{};
  const bool backfaceVisibility{};
  const bool shouldRasterize{};
  const int zIndex{};

  // Events
  const PointerEventsMode pointerEvents{};
  const EdgeInsets hitSlop{};
  const bool onLayout{};

  const bool collapsable{true};

#pragma mark - Convenience Methods

  BorderMetrics resolveBorderMetrics(bool isRTL) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ReactABI34_0_0
} // namespace facebook
