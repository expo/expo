/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI49_0_0React/ABI49_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/root/RootShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutConstraints.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ReactPrimitives.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0MountingCoordinator.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowTreeDelegate.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowTreeRevision.h>
#include <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>
#include "ABI49_0_0MountingOverrideDelegate.h"

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

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

    // Indicates if mounting will be triggered synchronously and ABI49_0_0React will
    // not get a chance to interrupt painting.
    // This should be set to `false` when a commit is coming from ABI49_0_0React. It
    // will then let ABI49_0_0React run layout effects and apply updates before paint.
    // For all other commits, should be true.
    bool mountSynchronously{true};

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
      const ShadowTreeCommitTransaction &transaction,
      const CommitOptions &commitOptions) const;

  /*
   * Calls `tryCommit` in a loop until it finishes successfully.
   */
  CommitStatus commit(
      const ShadowTreeCommitTransaction &transaction,
      const CommitOptions &commitOptions) const;

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

  void mount(ShadowTreeRevision revision, bool mountSynchronously) const;

  void emitLayoutEvents(
      std::vector<LayoutableShadowNode const *> &affectedLayoutableNodes) const;

  SurfaceId const surfaceId_;
  ShadowTreeDelegate const &delegate_;
  mutable std::shared_mutex commitMutex_;
  mutable CommitMode commitMode_{
      CommitMode::Normal}; // Protected by `commitMutex_`.
  mutable ShadowTreeRevision currentRevision_; // Protected by `commitMutex_`.
  MountingCoordinator::Shared mountingCoordinator_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
