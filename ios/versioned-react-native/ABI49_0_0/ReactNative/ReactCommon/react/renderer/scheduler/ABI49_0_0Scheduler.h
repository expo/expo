/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>

#include <ABI49_0_0ReactCommon/ABI49_0_0RuntimeExecutor.h>
#include <ABI49_0_0React/config/ABI49_0_0ReactNativeConfig.h>
#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorFactory.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ComponentDescriptor.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventEmitter.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventListener.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutConstraints.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0MountingOverrideDelegate.h>
#include <ABI49_0_0React/renderer/scheduler/ABI49_0_0InspectorData.h>
#include <ABI49_0_0React/renderer/scheduler/ABI49_0_0SchedulerDelegate.h>
#include <ABI49_0_0React/renderer/scheduler/ABI49_0_0SchedulerToolbox.h>
#include <ABI49_0_0React/renderer/scheduler/ABI49_0_0SurfaceHandler.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0UIManagerAnimationDelegate.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0UIManagerBinding.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0UIManagerDelegate.h>
#include <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

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
      MountingCoordinator::Shared mountingCoordinator,
      bool mountSynchronously) override;
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
  std::shared_ptr<const ABI49_0_0ReactNativeConfig> ABI49_0_0ReactNativeConfig_;

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
  bool reduceDeleteCreateMutationLayoutAnimation_{false};
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
