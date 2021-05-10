/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI40_0_0React/components/unimplementedview/UnimplementedViewProps.h>
#include <ABI40_0_0React/components/view/ConcreteViewShadowNode.h>

namespace ABI40_0_0facebook {
namespace ABI40_0_0React {

extern const char UnimplementedViewComponentName[];

using UnimplementedViewShadowNode = ConcreteViewShadowNode<
    UnimplementedViewComponentName,
    UnimplementedViewProps>;

} // namespace ABI40_0_0React
} // namespace ABI40_0_0facebook
