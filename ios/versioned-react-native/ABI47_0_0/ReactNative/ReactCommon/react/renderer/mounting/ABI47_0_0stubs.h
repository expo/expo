/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/core/ShadowNode.h>
#include "ABI47_0_0StubView.h"
#include "ABI47_0_0StubViewTree.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Builds a ShadowView tree from given root ShadowNode using custom built-in
 * implementation (*without* using Differentiator).
 */
StubViewTree buildStubViewTreeWithoutUsingDifferentiator(
    ShadowNode const &rootShadowNode);

/*
 * Builds a ShadowView tree from given root ShadowNode using Differentiator by
 * generating mutation instructions between empty and final trees.
 */
StubViewTree buildStubViewTreeUsingDifferentiator(
    ShadowNode const &rootShadowNode);

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
