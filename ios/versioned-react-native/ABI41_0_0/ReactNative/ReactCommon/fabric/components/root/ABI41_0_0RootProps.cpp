/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI41_0_0RootProps.h"

#include <ABI41_0_0React/components/view/YogaLayoutableShadowNode.h>
#include <ABI41_0_0React/components/view/conversions.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

RootProps::RootProps(RootProps const &sourceProps, RawProps const &rawProps)
    : ViewProps(sourceProps, rawProps) {}

RootProps::RootProps(
    RootProps const &sourceProps,
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext)
    : ViewProps(),
      layoutConstraints(layoutConstraints),
      layoutContext(layoutContext){};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
