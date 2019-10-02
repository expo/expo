/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0RootProps.h"

#include <ReactABI34_0_0/components/view/YogaLayoutableShadowNode.h>
#include <ReactABI34_0_0/components/view/conversions.h>

namespace facebook {
namespace ReactABI34_0_0 {

static ABI34_0_0YGStyle ABI34_0_0yogaStyleFromLayoutConstraints(
    const LayoutConstraints &layoutConstraints) {
  auto ABI34_0_0yogaStyle = ABI34_0_0YGStyle{};
  ABI34_0_0yogaStyle.minDimensions[ABI34_0_0YGDimensionWidth] =
      ABI34_0_0yogaStyleValueFromFloat(layoutConstraints.minimumSize.width);
  ABI34_0_0yogaStyle.minDimensions[ABI34_0_0YGDimensionHeight] =
      ABI34_0_0yogaStyleValueFromFloat(layoutConstraints.minimumSize.height);

  ABI34_0_0yogaStyle.maxDimensions[ABI34_0_0YGDimensionWidth] =
      ABI34_0_0yogaStyleValueFromFloat(layoutConstraints.maximumSize.width);
  ABI34_0_0yogaStyle.maxDimensions[ABI34_0_0YGDimensionHeight] =
      ABI34_0_0yogaStyleValueFromFloat(layoutConstraints.maximumSize.height);

  ABI34_0_0yogaStyle.direction =
      ABI34_0_0yogaDirectionFromLayoutDirection(layoutConstraints.layoutDirection);

  return ABI34_0_0yogaStyle;
}

RootProps::RootProps(
    const RootProps &sourceProps,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext)
    : ViewProps(ABI34_0_0yogaStyleFromLayoutConstraints(layoutConstraints)),
      layoutConstraints(layoutConstraints),
      layoutContext(layoutContext){};

} // namespace ReactABI34_0_0
} // namespace facebook
