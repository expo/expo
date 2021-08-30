/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI41_0_0React/core/ShadowNode.h>
#include <ABI41_0_0React/core/ShadowNodeFragment.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

/**
 * Problem Description: because of C++ State, the ABI41_0_0React Native C++ ShadowTree
 * can diverge from the ABI41_0_0ReactJS ShadowTree; ABI41_0_0ReactJS communicates all tree
 * changes to C++, but C++ state commits are not propagated to ABI41_0_0ReactJS (ABI41_0_0ReactJS
 * may or may not clone nodes with state changes, but it has no way of knowing
 * if it /should/ clone those nodes; so those clones may never happen). This
 * causes a number of problems. This function resolves the problem by taking a
 * candidate tree being committed, and sees if any State changes need to be
 * applied to it. If any changes need to be made, a new ShadowNode is returned;
 * otherwise, nullptr is returned if the node is already consistent with the
 * latest tree, including all state changes.
 *
 * This should be called during the commit phase, pre-layout and pre-diff.
 */
UnsharedShadowNode reconcileStateWithTree(
    ShadowNode const *newNode,
    SharedShadowNode committedNode);

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
