/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <butter/mutex.h>
#include <memory>

#include <ABI47_0_0React/ABI47_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/root/RootShadowNode.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/LayoutConstraints.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ABI47_0_0ReactPrimitives.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ShadowNode.h>
#include <ABI47_0_0React/ABI47_0_0renderer/mounting/MountingCoordinator.h>
#include <ABI47_0_0React/ABI47_0_0renderer/mounting/ShadowTreeDelegate.h>
#include <ABI47_0_0React/ABI47_0_0renderer/mounting/ShadowTreeRevision.h>
#include <ABI47_0_0React/ABI47_0_0utils/ContextContainer.h>
#include "ABI47_0_0MountingOverrideDelegate.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

using ShadowTreeCommitTransaction = std::function<RootShadowNode::Unshared(
    RootShadowNode const &oldRootShadowNode)>;

/*
 * Represents the shadow tree and its lifecycle.
 */
class ShadowTree final {
 public:
  using Unique = std::unique_ptr<ShadowTree>;

  /*
   * Represents a result of a `commit` operation.
   */
  enum class CommitStatus {
    Succeeded,
    Failed,
    Cancelled,
  };

  /*
   * Represents commits' side-effects propagation mode.
   */
  enum class CommitMode {
    // Commits' side-effects are observable via `MountingCoordinator`.
    // The rendering pipeline fully works end-to-end.
    Normal,

    // Commits' side-effects are *not* observable via `MountingCoordinator`.
    // The mounting phase is skipped in the rendering pipeline.
    Suspended,
  };

  struct CommitOptions {
    bool enableStateReconciliation{false};

    // Called during `tryCommit` phase. Returning true indicates current commit
    // should yield to the next commit.
    std::function<bool()> shouldYield;
  };

  /*
   * Creates a new shadow tree instance.
   */
  ShadowTree(
      SurfaceId surfaceId,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext,
      ShadowTreeDelegate const &delegate,
      ContextContainer const &contextContainer);

  ~ShadowTree();

  /*
   * Returns the `SurfaceId` associated with the shadow tree.
   */
  SurfaceId getSurfaceId() const;

  /*
   * Sets and gets the commit mode.
   * Changing commit mode from `Suspended` to `Normal` will flush all suspended
   * changes to `MountingCoordinator`.
   */
  void setCommitMode(CommitMode commitMode) const;
  CommitMode getCommitMode() const;

  /*
   * Performs commit calling `transaction` function with a `oldRootShadowNode`
   * and expecting a `newRootShadowNode` as a return value.
   * The `transaction` function can cancel commit returning `nullptr`.
   */
  CommitStatus tryCommit(
      ShadowTreeCommitTransaction transaction,
      CommitOptions commitOptions = {false}) const;

  /*
   * Calls `tryCommit` in a loop until it finishes successfully.
   */
  CommitStatus commit(
      ShadowTreeCommitTransaction transaction,
      CommitOptions commitOptions = {false}) const;

  /*
   * Returns a `ShadowTreeRevision` representing the momentary state of
   * the `ShadowTree`.
   */
  ShadowTreeRevision getCurrentRevision() const;

  /*
   * Commit an empty tree (a new `RootShadowNode` with no children).
   */
  void commitEmptyTree() const;

  /**
   * Forces the ShadowTree to ping its delegate that an update is available.
   * Useful for animations on Android.
   * @return
   */
  void notifyDelegatesOfUpdates() const;

  MountingCoordinator::Shared getMountingCoordinator() const;

 private:
  constexpr static ShadowTreeRevision::Number INITIAL_REVISION{0};

  void mount(ShadowTreeRevision const &revision) const;

  void emitLayoutEvents(
      std::vector<LayoutableShadowNode const *> &affectedLayoutableNodes) const;

  SurfaceId const surfaceId_;
  ShadowTreeDelegate const &delegate_;
  mutable butter::shared_mutex commitMutex_;
  mutable CommitMode commitMode_{
      CommitMode::Normal}; // Protected by `commitMutex_`.
  mutable ShadowTreeRevision currentRevision_; // Protected by `commitMutex_`.
  MountingCoordinator::Shared mountingCoordinator_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
