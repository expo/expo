// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <ABI37_0_0React/mounting/MountingCoordinator.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

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
      ShadowTree const &shadowTree,
      MountingCoordinator::Shared const &mountingCoordinator) const = 0;

  virtual ~ShadowTreeDelegate() noexcept = default;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
