// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0uimanager/TreeMutationInstruction.h>

namespace facebook {
namespace ReactABI31_0_0 {

class ShadowTree;

/*
 * Abstract class for ShadowTree's delegate.
 */
class ShadowTreeDelegate {
public:

  /*
   * Called right after Shadow Tree commit a new state of the the tree.
   */
  virtual void shadowTreeDidCommit(const std::shared_ptr<ShadowTree> &shadowTree, const TreeMutationInstructionList &instructions) = 0;
};

} // namespace ReactABI31_0_0
} // namespace facebook
