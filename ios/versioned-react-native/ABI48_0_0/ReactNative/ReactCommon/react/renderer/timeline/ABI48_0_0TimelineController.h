/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI48_0_0butter/ABI48_0_0map.h>

#include <ABI48_0_0React/ABI48_0_0renderer/core/ABI48_0_0ReactPrimitives.h>
#include <ABI48_0_0React/ABI48_0_0renderer/timeline/Timeline.h>
#include <ABI48_0_0React/ABI48_0_0renderer/timeline/TimelineHandler.h>
#include <ABI48_0_0React/ABI48_0_0renderer/uimanager/UIManagerCommitHook.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * Provides tools for introspecting the series of commits and associated
 * side-effects, allowing to "rewind" UI to any particular commit from the past.
 */
class TimelineController final : public UIManagerCommitHook {
 public:
  using Shared = std::shared_ptr<TimelineController const>;

  /*
   * Creates a `TimelineHandler` associated with given `SurfaceId` and starts
   * the introspection process.
   */
  TimelineHandler enable(SurfaceId surfaceId) const;

  /*
   * Consumes and destroys a `TimelineHandler` instance triggering the
   * destruction of all associated resources and stoping the introspection
   * process.
   */
  void disable(TimelineHandler &&handler) const;

  /*
   * TO BE DELETED.
   */
  SurfaceId lastUpdatedSurface() const {
    return lastUpdatedSurface_;
  }

#pragma mark - UIManagerCommitHook

  RootShadowNode::Unshared shadowTreeWillCommit(
      ShadowTree const &shadowTree,
      RootShadowNode::Shared const &oldRootShadowNode,
      RootShadowNode::Unshared const &newRootShadowNode)
      const noexcept override;

  void commitHookWasRegistered(
      UIManager const &uiManager) const noexcept override;

  void commitHookWasUnregistered(
      UIManager const &uiManager) const noexcept override;

 private:
  /*
   * Protects all the data members.
   */
  mutable butter::shared_mutex timelinesMutex_;

  /*
   * Owning collection of all running `Timeline` instances.
   */
  mutable butter::map<SurfaceId, std::unique_ptr<Timeline>> timelines_;

  mutable UIManager const *uiManager_;
  mutable SurfaceId lastUpdatedSurface_;
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
