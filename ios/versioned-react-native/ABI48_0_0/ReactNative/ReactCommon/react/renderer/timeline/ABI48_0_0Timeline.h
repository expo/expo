/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <ABI48_0_0butter/ABI48_0_0mutex.h>

#include <ABI48_0_0React/ABI48_0_0renderer/core/ABI48_0_0ReactPrimitives.h>
#include <ABI48_0_0React/ABI48_0_0renderer/timeline/TimelineSnapshot.h>
#include <ABI48_0_0React/ABI48_0_0renderer/uimanager/UIManagerCommitHook.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

class UIManager;

class Timeline final {
  friend class TimelineHandler;
  friend class TimelineController;

 public:
  Timeline(ShadowTree const &shadowTree);

 private:
#pragma mark - Private methods to be used by `TimelineHandler`.

  void pause() const noexcept;
  void resume() const noexcept;
  bool isPaused() const noexcept;
  TimelineFrame::List getFrames() const noexcept;
  TimelineFrame getCurrentFrame() const noexcept;
  void rewind(TimelineFrame const &frame) const noexcept;
  SurfaceId getSurfaceId() const noexcept;

#pragma mark - Private methods to be used by `TimelineController`.

  RootShadowNode::Unshared shadowTreeWillCommit(
      ShadowTree const &shadowTree,
      RootShadowNode::Shared const &oldRootShadowNode,
      RootShadowNode::Unshared const &newRootShadowNode) const noexcept;

#pragma mark - Private & Internal

  void record(RootShadowNode::Shared const &rootShadowNode) const noexcept;
  void rewind(TimelineSnapshot const &snapshot) const noexcept;

  mutable std::recursive_mutex mutex_;
  mutable ShadowTree const *shadowTree_{nullptr};
  mutable int currentSnapshotIndex_{0};
  mutable TimelineSnapshot::List snapshots_{};
  mutable bool paused_{false};
  mutable bool rewinding_{false};
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
