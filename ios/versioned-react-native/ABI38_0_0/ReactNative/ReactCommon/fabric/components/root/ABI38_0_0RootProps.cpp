/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI38_0_0RootProps.h"

#include <ABI38_0_0React/components/view/YogaLayoutableShadowNode.h>
#include <ABI38_0_0React/components/view/conversions.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

static ABI38_0_0YGStyle yogaStyleFromLayoutConstraints(
    LayoutConstraints const &layoutConstraints) {
  auto yogaStyle = ABI38_0_0YGStyle{};
  yogaStyle.minDimensions()[ABI38_0_0YGDimensionWidth] =
      yogaStyleValueFromFloat(layoutConstraints.minimumSize.width);
  yogaStyle.minDimensions()[ABI38_0_0YGDimensionHeight] =
      yogaStyleValueFromFloat(layoutConstraints.minimumSize.height);

  yogaStyle.maxDimensions()[ABI38_0_0YGDimensionWidth] =
      yogaStyleValueFromFloat(layoutConstraints.maximumSize.width);
  yogaStyle.maxDimensions()[ABI38_0_0YGDimensionHeight] =
      yogaStyleValueFromFloat(layoutConstraints.maximumSize.height);

  yogaStyle.direction() =
      yogaDirectionFromLayoutDirection(layoutConstraints.layoutDirection);

  return yogaStyle;
}

RootProps::RootProps(RootProps const &sourceProps, RawProps const &rawProps)
    : ViewProps(sourceProps, rawProps) {}

RootProps::RootProps(
    RootProps const &sourceProps,
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext)
    : ViewProps(yogaStyleFromLayoutConstraints(layoutConstraints)),
      layoutConstraints(layoutConstraints),
      layoutContext(layoutContext){};

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
