/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>

#include <ABI43_0_0ReactCommon/ABI43_0_0RuntimeExecutor.h>
#include <ABI43_0_0React/ABI43_0_0config/ABI43_0_0ReactNativeConfig.h>
#include <ABI43_0_0React/ABI43_0_0renderer/componentregistry/ComponentDescriptorFactory.h>
#include <ABI43_0_0React/ABI43_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ComponentDescriptor.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/LayoutConstraints.h>
#include <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingOverrideDelegate.h>
#include <ABI43_0_0React/ABI43_0_0renderer/scheduler/SchedulerDelegate.h>
#include <ABI43_0_0React/ABI43_0_0renderer/scheduler/SchedulerToolbox.h>
#include <ABI43_0_0React/ABI43_0_0renderer/uimanager/UIManagerAnimationDelegate.h>
#include <ABI43_0_0React/ABI43_0_0renderer/uimanager/UIManagerBinding.h>
#include <ABI43_0_0React/ABI43_0_0renderer/uimanager/UIManagerDelegate.h>
#include <ABI43_0_0React/ABI43_0_0utils/ContextContainer.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * Scheduler coordinates Shadow Tree updates and event flows.
 */
class Scheduler final : public UIManagerDelegate {
 public:
  Scheduler(
      SchedulerToolbox schedulerToolbox,
      UIManagerAnimationDelegate *animationDelegate,
      SchedulerDelegate *delegate);
  ~Scheduler();

#pragma mark - Surface Management

  void startSurface(
      SurfaceId surfaceId,
      const std::string &moduleName,
      const folly::dynamic &initialProps,
      const LayoutConstraints &layoutConstraints = {},
      const LayoutContext &layoutContext = {},
      std::weak_ptr<MountingOverrideDelegate const> mountingOverrideDelegate =
          {}) const;

  void renderTemplateToSurface(
      SurfaceId surfaceId,
      const std::string &uiTemplate);

  void stopSurface(SurfaceId surfaceId) const;

  Size measureSurface(
      SurfaceId surfaceId,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext) const;

  /*
   * Applies given `layoutConstraints` and `layoutContext` to a Surface.
   * The user interface will be relaid out as a result. The operation will be
   * performed synchronously (including mounting) if the method is called
   * on the main thread.
   * Can be called from any thread.
   */
  void constraintSurfaceLayout(
      SurfaceId surfaceId,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext) const;

  /*
   * This is broken. Please do not use.
   * `ComponentDescriptor`s are not designed to be used outside of `UIManager`,
   * there is no any garantees about their lifetime.
   */
  ComponentDescriptor const *
  findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
      ComponentHandle handle) const;

  MountingCoordinator::Shared findMountingCoordinator(
      SurfaceId surfaceId) const;

#pragma mark - Delegate

  /*
   * Sets and gets the Scheduler's delegate.
   * If you requesting a ComponentDescriptor and unsure that it's there, you are
   * doing something wrong.
   */
  void setDelegate(SchedulerDelegate *delegate);
  SchedulerDelegate *getDelegate() const;

#pragma mark - UIManagerAnimationDelegate
  // This is not needed on iOS or any platform that has a "pull" instead of
  // "push" MountingCoordinator model. This just tells the delegate an update
  // is available and that it should `pullTransaction`; we may want to rename
  // this to be more generic and not animation-specific.
  void animationTick() const;

#pragma mark - UIManagerDelegate

  void uiManagerDidFinishTransaction(
      MountingCoordinator::Shared const &mountingCoordinator) override;
  void uiManagerDidCreateShadowNode(
      const ShadowNode::Shared &shadowNode) override;
  void uiManagerDidDispatchCommand(
      const ShadowNode::Shared &shadowNode,
      std::string const &commandName,
      folly::dynamic const args) override;
  void uiManagerDidSetJSResponder(
      SurfaceId surfaceId,
      const ShadowNode::Shared &shadowView,
      bool blockNativeResponder) override;
  void uiManagerDidClearJSResponder() override;

 private:
  SchedulerDelegate *delegate_;
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  std::unique_ptr<const RootComponentDescriptor> rootComponentDescriptor_;
  RuntimeExecutor runtimeExecutor_;
  std::shared_ptr<UIManager> uiManager_;
  std::shared_ptr<const ABI43_0_0ReactNativeConfig> ABI43_0_0ReactNativeConfig_;

  /*
   * At some point, we have to have an owning shared pointer to something that
   * will become an `EventDispatcher` a moment later. That's why we have it as a
   * pointer to an optional: we construct the pointer first, share that with
   * parts that need to have ownership (and only ownership) of that, and then
   * fill the optional.
   */
  std::shared_ptr<better::optional<EventDispatcher const>> eventDispatcher_;

  /*
   * Temporary flags.
   */
  bool enableReparentingDetection_{false};
  bool removeOutstandingSurfacesOnDestruction_{false};
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
