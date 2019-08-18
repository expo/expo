/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0RootProps.h"

#include <ABI31_0_0fabric/ABI31_0_0components/view/conversions.h>
#include <ABI31_0_0fabric/ABI31_0_0components/view/YogaLayoutableShadowNode.h>

namespace facebook {
namespace ReactABI31_0_0 {

static ABI31_0_0YGStyle yogaStyleFromLayoutConstraints(const LayoutConstraints &layoutConstraints) {
  ABI31_0_0YGStyle yogaStyle;
  yogaStyle.minDimensions[ABI31_0_0YGDimensionWidth] =
    yogaStyleValueFromFloat(layoutConstraints.minimumSize.width);
  yogaStyle.minDimensions[ABI31_0_0YGDimensionHeight] =
    yogaStyleValueFromFloat(layoutConstraints.minimumSize.height);

  yogaStyle.maxDimensions[ABI31_0_0YGDimensionWidth] =
    yogaStyleValueFromFloat(layoutConstraints.maximumSize.width);
  yogaStyle.maxDimensions[ABI31_0_0YGDimensionHeight] =
    yogaStyleValueFromFloat(layoutConstraints.maximumSize.height);

  return yogaStyle;
}

RootProps::RootProps(
  const RootProps &sourceProps,
  const LayoutConstraints &layoutConstraints,
  const LayoutContext &layoutContext
):
  ViewProps(yogaStyleFromLayoutConstraints(layoutConstraints)),
  layoutConstraints(layoutConstraints),
  layoutContext(layoutContext) {};

} // namespace ReactABI31_0_0
} // namespace facebook
