/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/components/view/ConcreteViewShadowNode.h>
#include "ABI41_0_0RCTARTSurfaceViewProps.h"

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

extern const char ABI41_0_0RCTARTSurfaceViewComponentName[];

/*
 * `ShadowNode` for <ABI41_0_0ARTSurfaceView> component.
 */
using ABI41_0_0RCTARTSurfaceShadowNode = ConcreteViewShadowNode<
    ABI41_0_0RCTARTSurfaceViewComponentName,
    ABI41_0_0RCTARTSurfaceViewProps,
    ViewEventEmitter>;

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
