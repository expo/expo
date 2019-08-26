/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0components/view/AccessibilityProps.h>
#include <ABI31_0_0fabric/ABI31_0_0components/view/primitives.h>
#include <ABI31_0_0fabric/ABI31_0_0components/view/YogaStylableProps.h>
#include <ABI31_0_0fabric/ABI31_0_0core/Props.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/Geometry.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/Color.h>

namespace facebook {
namespace ReactABI31_0_0 {

class ViewProps;

using SharedViewProps = std::shared_ptr<const ViewProps>;

class ViewProps:
  public Props,
  public YogaStylableProps,
  public AccessibilityProps {

public:
  ViewProps() = default;
  ViewProps(const ABI31_0_0YGStyle &yogaStyle);
  ViewProps(const ViewProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  // Color
  const Float opacity {1.0};
  const SharedColor foregroundColor {};
  const SharedColor backgroundColor {};

  // Borders
  const EdgeInsets borderWidth {};
  const CornerInsets borderRadius {};
  const SharedColor borderColor {};
  const BorderStyle borderStyle {};

  // Shadow
  const SharedColor shadowColor {};
  const Size shadowOffset {};
  const Float shadowOpacity {};
  const Float shadowRadius {};

  // Transform
  const Transform transform {};
  const bool backfaceVisibility {};
  const bool shouldRasterize {};
  const int zIndex {};

  // Events
  const PointerEventsMode pointerEvents {};
  const EdgeInsets hitSlop {};
  const bool onLayout {};

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;
};

} // namespace ReactABI31_0_0
} // namespace facebook
