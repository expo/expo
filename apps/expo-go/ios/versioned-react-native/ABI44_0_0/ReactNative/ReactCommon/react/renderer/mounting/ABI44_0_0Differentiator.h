/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI44_0_0React/ABI44_0_0renderer/core/ShadowNode.h>
#include <ABI44_0_0React/ABI44_0_0renderer/mounting/ShadowViewMutation.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

enum class ReparentMode { Flatten, Unflatten };

/*
 * Calculates a list of view mutations which describes how the old
 * `ShadowTree` can be transformed to the new one.
 * The list of mutations might be and might not be optimal.
 */
ShadowViewMutationList calculateShadowViewMutations(
    ShadowNode const &oldRootShadowNode,
    ShadowNode const &newRootShadowNode,
    bool enableReparentingDetection = false);

/*
 * Generates a list of `ShadowViewNodePair`s that represents a layer of a
 * flattened view hierarchy.
 */
ShadowViewNodePair::List sliceChildShadowNodeViewPairs(
    ShadowNode const &shadowNode);

/**
 * Generates a list of `ShadowViewNodePair`s that represents a layer of a
 * flattened view hierarchy. The V2 version preserves nodes even if they do
 * not form views and their children are flattened.
 */
ShadowViewNodePair::List sliceChildShadowNodeViewPairsV2(
    ShadowNode const &shadowNode,
    bool allowFlattened = false);

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
