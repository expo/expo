/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>

#include <ABI48_0_0ReactCommon/ABI48_0_0RuntimeExecutor.h>
#include <ABI48_0_0React/ABI48_0_0config/ABI48_0_0ReactNativeConfig.h>
#include <ABI48_0_0React/ABI48_0_0renderer/componentregistry/ComponentDescriptorFactory.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ComponentDescriptor.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/EventEmitter.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/EventListener.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/LayoutConstraints.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mounting/MountingOverrideDelegate.h>
#include <ABI48_0_0React/ABI48_0_0renderer/scheduler/InspectorData.h>
#include <ABI48_0_0React/ABI48_0_0renderer/scheduler/SchedulerDelegate.h>
#include <ABI48_0_0React/ABI48_0_0renderer/scheduler/SchedulerToolbox.h>
#include <ABI48_0_0React/ABI48_0_0renderer/scheduler/SurfaceHandler.h>
#include <ABI48_0_0React/ABI48_0_0renderer/uimanager/UIManagerAnimationDelegate.h>
#include <ABI48_0_0React/ABI48_0_0renderer/uimanager/UIManagerBinding.h>
#include <ABI48_0_0React/ABI48_0_0renderer/uimanager/UIManagerDelegate.h>
#include <ABI48_0_0React/ABI48_0_0utils/ContextContainer.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * Scheduler coordinates Shadow Tree updates and event flows.
 */
class Scheduler final : public UIManagerDelegate {
 public:
  Scheduler(
      SchedulerToolbox const &schedulerToolbox,
      UIManagerAnimationDelegate *animationDelegate,
      SchedulerDelegate *delegate);
  ~Scheduler();

#pragma mark - Surface Management

  /*
   * Registers and unregisters a `SurfaceHandler` object in the `Scheduler`.
   * All registered `SurfaceHandler` objects must be unregistered
   * (with the same `Scheduler`) before their deallocation.
   */
  void registerSurface(SurfaceHandler const &surfaceHandler) const noexcept;
  void unregisterSurface(SurfaceHandler const &surfaceHandler) const noexcept;

  InspectorData getInspectorDataForInstance(
      EventEmitter const &eventEmitter) const noexcept;

  void renderTemplateToSurface(
      SurfaceId surfaceId,
      const std::string &uiTemplate);

  /*
   * This is broken. Please do not use.
   * `ComponentDescriptor`s are not designed to be used outside of `UIManager`,
   * there is no any guarantees about their lifetime.
   */
  ComponentDescriptor const *
  findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
      ComponentHandle handle) const;

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
  void uiManagerDidCreateShadowNode(const ShadowNode &shadowNode) override;
  void uiManagerDidDispatchCommand(
      const ShadowNode::Shared &shadowNode,
      std::string const &commandName,
      folly::dynamic const &args) override;
  void uiManagerDidSendAccessibilityEvent(
      const ShadowNode::Shared &shadowNode,
      std::string const &eventType) override;
  void uiManagerDidSetIsJSResponder(
      ShadowNode::Shared const &shadowNode,
      bool isJSResponder,
      bool blockNativeResponder) override;

#pragma mark - ContextContainer
  ContextContainer::Shared getContextContainer() const;

#pragma mark - UIManager
  std::shared_ptr<UIManager> getUIManager() const;

#pragma mark - Event listeners
  void addEventListener(const std::shared_ptr<EventListener const> &listener);
  void removeEventListener(
      const std::shared_ptr<EventListener const> &listener);

 private:
  friend class SurfaceHandler;

  SchedulerDelegate *delegate_;
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  RuntimeExecutor runtimeExecutor_;
  std::shared_ptr<UIManager> uiManager_;
  std::shared_ptr<const ABI48_0_0ReactNativeConfig> ABI48_0_0ReactNativeConfig_;

  std::vector<std::shared_ptr<UIManagerCommitHook const>> commitHooks_;

  /*
   * At some point, we have to have an owning shared pointer to something that
   * will become an `EventDispatcher` a moment later. That's why we have it as a
   * pointer to an optional: we construct the pointer first, share that with
   * parts that need to have ownership (and only ownership) of that, and then
   * fill the optional.
   */
  std::shared_ptr<std::optional<EventDispatcher const>> eventDispatcher_;

  /**
   * Hold onto ContextContainer. See SchedulerToolbox.
   * Must not be nullptr.
   */
  ContextContainer::Shared contextContainer_;

  /*
   * Temporary flags.
   */
  bool removeOutstandingSurfacesOnDestruction_{false};
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
