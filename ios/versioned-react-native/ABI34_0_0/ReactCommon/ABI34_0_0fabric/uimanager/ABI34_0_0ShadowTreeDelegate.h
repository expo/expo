// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <ReactABI34_0_0/mounting/ShadowViewMutation.h>

namespace facebook {
namespace ReactABI34_0_0 {

class ShadowTree;

/*
 * Abstract class for ShadowTree's delegate.
 */
class ShadowTreeDelegate {
 public:
  /*
   * Called right after Shadow Tree commit a new state of the the tree.
   */
  virtual void shadowTreeDidCommit(
      const ShadowTree &shadowTree,
      const ShadowViewMutationList &mutations,
      long commitStartTime,
      long layoutTime) const = 0;

  virtual ~ShadowTreeDelegate() noexcept = default;
};

} // namespace ReactABI34_0_0
} // namespace facebook
