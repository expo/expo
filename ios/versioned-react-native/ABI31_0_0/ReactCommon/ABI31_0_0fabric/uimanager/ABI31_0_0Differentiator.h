// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0core/ShadowNode.h>
#include <ABI31_0_0fabric/ABI31_0_0uimanager/TreeMutationInstruction.h>

namespace facebook {
namespace ReactABI31_0_0 {

/*
 * Calculates set of mutation instuctions which describe how the old
 * ShadowNode tree can be transformed to the new ShadowNode tree.
 * The set of instuctions might be and might not be optimal.
 */
void calculateMutationInstructions(
  TreeMutationInstructionList &instructions,
  const SharedShadowNode &oldNode,
  const SharedShadowNode &newNode
);

} // namespace ReactABI31_0_0
} // namespace facebook
