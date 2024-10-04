/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI44_0_0RootProps.h"

#include <ABI44_0_0React/ABI44_0_0renderer/components/view/YogaLayoutableShadowNode.h>
#include <ABI44_0_0React/ABI44_0_0renderer/components/view/conversions.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

RootProps::RootProps(RootProps const &sourceProps, RawProps const &rawProps)
    : ViewProps(sourceProps, rawProps) {}

RootProps::RootProps(
    RootProps const &sourceProps,
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext)
    : ViewProps(),
      layoutConstraints(layoutConstraints),
      layoutContext(layoutContext){};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
