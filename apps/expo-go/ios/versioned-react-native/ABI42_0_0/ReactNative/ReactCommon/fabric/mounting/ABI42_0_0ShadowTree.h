/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/mutex.h>
#include <memory>

#include <ABI42_0_0React/components/root/RootComponentDescriptor.h>
#include <ABI42_0_0React/components/root/RootShadowNode.h>
#include <ABI42_0_0React/core/LayoutConstraints.h>
#include <ABI42_0_0React/core/ABI42_0_0ReactPrimitives.h>
#include <ABI42_0_0React/core/ShadowNode.h>
#include <ABI42_0_0React/mounting/MountingCoordinator.h>
#include <ABI42_0_0React/mounting/ShadowTreeDelegate.h>
#include <ABI42_0_0React/mounting/ShadowTreeRevision.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

using ShadowTreeCommitTransaction = std::function<RootShadowNode::Unshared(
    RootShadowNode::Shared const &oldRootShadowNode)>;

/*
 * Represents the shadow tree and its lifecycle.
 */
class ShadowTree final {
 public:
  /*
   * Creates a new shadow tree instance.
   */
  ShadowTree(
      SurfaceId surfaceId,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext,
      RootComponentDescriptor const &rootComponentDescriptor,
      ShadowTreeDelegate const &delegate);

  ~ShadowTree();

  /*
   * Returns the `SurfaceId` associated with the shadow tree.
   */
  SurfaceId getSurfaceId() const;

  /*
   * Performs commit calling `transaction` function with a `oldRootShadowNode`
   * and expecting a `newRootShadowNode` as a return value.
   * The `transaction` function can abort commit returning `nullptr`.
   * Returns `true` if the operation finished successfully.
   */
  bool tryCommit(
      ShadowTreeCommitTransaction transaction,
      bool enableStateReconciliation = false) const;

  /*
   * Calls `tryCommit` in a loop until it finishes successfully.
   */
  void commit(
      ShadowTreeCommitTransaction transaction,
      bool enableStateReconciliation = false) const;

  /*
   * Commit an empty tree (a new `RootShadowNode` with no children).
   */
  void commitEmptyTree() const;

  MountingCoordinator::Shared getMountingCoordinator() const;

 private:
  RootShadowNode::Unshared cloneRootShadowNode(
      RootShadowNode::Shared const &oldRootShadowNode,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext) const;

  void emitLayoutEvents(
      std::vector<LayoutableShadowNode const *> &affectedLayoutableNodes) const;

  SurfaceId const surfaceId_;
  ShadowTreeDelegate const &delegate_;
  mutable better::shared_mutex commitMutex_;
  mutable RootShadowNode::Shared
      rootShadowNode_; // Protected by `commitMutex_`.
  mutable ShadowTreeRevision::Number revisionNumber_{
      0}; // Protected by `commitMutex_`.
  MountingCoordinator::Shared mountingCoordinator_;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
