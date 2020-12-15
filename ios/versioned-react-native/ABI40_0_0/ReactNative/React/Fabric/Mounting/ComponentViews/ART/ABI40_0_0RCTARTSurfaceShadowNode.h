/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI40_0_0React/components/view/ConcreteViewShadowNode.h>
#include "ABI40_0_0RCTARTSurfaceViewProps.h"

namespace ABI40_0_0facebook {
namespace ABI40_0_0React {

extern const char ABI40_0_0RCTARTSurfaceViewComponentName[];

/*
 * `ShadowNode` for <ABI40_0_0ARTSurfaceView> component.
 */
using ABI40_0_0RCTARTSurfaceShadowNode = ConcreteViewShadowNode<
    ABI40_0_0RCTARTSurfaceViewComponentName,
    ABI40_0_0RCTARTSurfaceViewProps,
    ViewEventEmitter>;

} // namespace ABI40_0_0React
} // namespace ABI40_0_0facebook
