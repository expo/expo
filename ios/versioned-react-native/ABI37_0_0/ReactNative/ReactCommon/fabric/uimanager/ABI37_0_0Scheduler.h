// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <mutex>

#include <ABI37_0_0React/components/root/RootComponentDescriptor.h>
#include <ABI37_0_0React/config/ABI37_0_0ReactNativeConfig.h>
#include <ABI37_0_0React/core/ComponentDescriptor.h>
#include <ABI37_0_0React/core/LayoutConstraints.h>
#include <ABI37_0_0React/mounting/ShadowTree.h>
#include <ABI37_0_0React/mounting/ShadowTreeDelegate.h>
#include <ABI37_0_0React/mounting/ShadowTreeRegistry.h>
#include <ABI37_0_0React/uimanager/ComponentDescriptorFactory.h>
#include <ABI37_0_0React/uimanager/ComponentDescriptorRegistry.h>
#include <ABI37_0_0React/uimanager/SchedulerDelegate.h>
#include <ABI37_0_0React/uimanager/SchedulerToolbox.h>
#include <ABI37_0_0React/uimanager/UIManagerBinding.h>
#include <ABI37_0_0React/uimanager/UIManagerDelegate.h>
#include <ABI37_0_0React/utils/ContextContainer.h>
#include <ABI37_0_0React/utils/RuntimeExecutor.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

/*
 * Scheduler coordinates Shadow Tree updates and event flows.
 */
class Scheduler final : public UIManagerDelegate, public ShadowTreeDelegate {
 public:
  Scheduler(SchedulerToolbox schedulerToolbox, SchedulerDelegate *delegate);
  ~Scheduler();

#pragma mark - Surface Management

  void startSurface(
      SurfaceId surfaceId,
      const std::string &moduleName,
      const folly::dynamic &initialProps,
      const LayoutConstraints &layoutConstraints = {},
      const LayoutContext &layoutContext = {}) const;

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

  const ComponentDescriptor &getComponentDescriptor(ComponentHandle handle);

#pragma mark - Delegate

  /*
   * Sets and gets the Scheduler's delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(SchedulerDelegate *delegate);
  SchedulerDelegate *getDelegate() const;

#pragma mark - UIManagerDelegate

  void uiManagerDidFinishTransaction(
      SurfaceId surfaceId,
      const SharedShadowNodeUnsharedList &rootChildNodes) override;
  void uiManagerDidCreateShadowNode(
      const SharedShadowNode &shadowNode) override;
  void uiManagerDidDispatchCommand(
      const SharedShadowNode &shadowNode,
      std::string const &commandName,
      folly::dynamic const args) override;
  void uiManagerDidSetJSResponder(
      SurfaceId surfaceId,
      const SharedShadowNode &shadowView,
      bool blockNativeResponder) override;
  void uiManagerDidClearJSResponder() override;

#pragma mark - ShadowTreeDelegate

  void shadowTreeDidCommit(
      ShadowTree const &shadowTree,
      MountingCoordinator::Shared const &mountingCoordinator) const override;

 private:
  SchedulerDelegate *delegate_;
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  std::unique_ptr<const RootComponentDescriptor> rootComponentDescriptor_;
  ShadowTreeRegistry shadowTreeRegistry_;
  RuntimeExecutor runtimeExecutor_;
  std::shared_ptr<UIManagerBinding> uiManagerBinding_;
  std::shared_ptr<const ABI37_0_0ReactNativeConfig> ABI37_0_0ReactNativeConfig_;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
