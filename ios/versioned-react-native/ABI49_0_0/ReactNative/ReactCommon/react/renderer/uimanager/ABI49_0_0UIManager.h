/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include <ABI49_0_0ReactCommon/ABI49_0_0RuntimeExecutor.h>
#include <shared_mutex>

#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorRegistry.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0RawValue.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0StateData.h>
#include <ABI49_0_0React/renderer/leakchecker/ABI49_0_0LeakChecker.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowTree.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowTreeDelegate.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowTreeRegistry.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0UIManagerAnimationDelegate.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0UIManagerDelegate.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0primitives.h>
#include <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

class UIManagerBinding;
class UIManagerCommitHook;

class UIManager final : public ShadowTreeDelegate {
 public:
  UIManager(
      RuntimeExecutor const &runtimeExecutor,
      BackgroundExecutor backgroundExecutor,
      ContextContainer::Shared contextContainer);

  ~UIManager();

  void setComponentDescriptorRegistry(
      const SharedComponentDescriptorRegistry &componentDescriptorRegistry);

  /*
   * Sets and gets the UIManager's delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setDelegate(UIManagerDelegate *delegate);
  UIManagerDelegate *getDelegate();

  /**
   * Sets and gets the UIManager's Animation APIs delegate.
   * The delegate is stored as a raw pointer, so the owner must null
   * the pointer before being destroyed.
   */
  void setAnimationDelegate(UIManagerAnimationDelegate *delegate);

  /**
   * Execute stopSurface on any UIMAnagerAnimationDelegate.
   */
  void stopSurfaceForAnimationDelegate(SurfaceId surfaceId) const;

  void animationTick() const;

  /*
   * Provides access to a UIManagerBindging.
   * The `callback` methods will not be called if the internal pointer to
   * `UIManagerBindging` is `nullptr`.
   * The callback is called synchronously on the same thread.
   */
  void visitBinding(
      std::function<void(UIManagerBinding const &uiManagerBinding)> const
          &callback,
      jsi::Runtime &runtime) const;

  /*
   * Registers and unregisters a commit hook.
   */
  void registerCommitHook(UIManagerCommitHook const &commitHook) const;
  void unregisterCommitHook(UIManagerCommitHook const &commitHook) const;

  ShadowNode::Shared getNewestCloneOfShadowNode(
      ShadowNode const &shadowNode) const;

#pragma mark - Surface Start & Stop

  void startSurface(
      ShadowTree::Unique &&shadowTree,
      std::string const &moduleName,
      folly::dynamic const &props,
      DisplayMode displayMode) const;

  void setSurfaceProps(
      SurfaceId surfaceId,
      std::string const &moduleName,
      folly::dynamic const &props,
      DisplayMode displayMode) const;

  ShadowTree::Unique stopSurface(SurfaceId surfaceId) const;

#pragma mark - ShadowTreeDelegate

  void shadowTreeDidFinishTransaction(
      MountingCoordinator::Shared mountingCoordinator,
      bool mountSynchronously) const override;

  RootShadowNode::Unshared shadowTreeWillCommit(
      ShadowTree const &shadowTree,
      RootShadowNode::Shared const &oldRootShadowNode,
      RootShadowNode::Unshared const &newRootShadowNode) const override;

  ShadowNode::Shared createNode(
      Tag tag,
      std::string const &componentName,
      SurfaceId surfaceId,
      const RawProps &props,
      SharedEventTarget eventTarget) const;

  ShadowNode::Shared cloneNode(
      ShadowNode const &shadowNode,
      ShadowNode::SharedListOfShared const &children = nullptr,
      RawProps const *rawProps = nullptr) const;

  void appendChild(
      const ShadowNode::Shared &parentShadowNode,
      const ShadowNode::Shared &childShadowNode) const;

  void completeSurface(
      SurfaceId surfaceId,
      ShadowNode::UnsharedListOfShared const &rootChildren,
      ShadowTree::CommitOptions commitOptions) const;

  void setIsJSResponder(
      ShadowNode::Shared const &shadowNode,
      bool isJSResponder,
      bool blockNativeResponder) const;

  ShadowNode::Shared findNodeAtPoint(
      ShadowNode::Shared const &shadowNode,
      Point point) const;

  /*
   * Returns layout metrics of given `shadowNode` relative to
   * `ancestorShadowNode` (relative to the root node in case if provided
   * `ancestorShadowNode` is nullptr).
   */
  LayoutMetrics getRelativeLayoutMetrics(
      ShadowNode const &shadowNode,
      ShadowNode const *ancestorShadowNode,
      LayoutableShadowNode::LayoutInspectingPolicy policy) const;

  /*
   * Creates a new shadow node with given state data, clones what's necessary
   * and performs a commit.
   */
  void updateState(StateUpdate const &stateUpdate) const;

  void dispatchCommand(
      const ShadowNode::Shared &shadowNode,
      std::string const &commandName,
      folly::dynamic const &args) const;

  void setNativeProps_DEPRECATED(
      ShadowNode::Shared const &shadowNode,
      RawProps const &rawProps) const;

  void sendAccessibilityEvent(
      const ShadowNode::Shared &shadowNode,
      std::string const &eventType);

  /*
   * Iterates over all shadow nodes which are parts of all registered surfaces
   * and find the one that has given `tag`. Returns `nullptr` if the node wasn't
   * found. This is a temporary workaround that should not be used in any core
   * functionality.
   */
  ShadowNode::Shared findShadowNodeByTag_DEPRECATED(Tag tag) const;

  ShadowTreeRegistry const &getShadowTreeRegistry() const;

 private:
  friend class UIManagerBinding;
  friend class Scheduler;
  friend class SurfaceHandler;

  /**
   * Configure a LayoutAnimation to happen on the next commit.
   * This API configures a global LayoutAnimation starting from the root node.
   */
  void configureNextLayoutAnimation(
      jsi::Runtime &runtime,
      RawValue const &config,
      jsi::Value const &successCallback,
      jsi::Value const &failureCallback) const;

  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  UIManagerDelegate *delegate_{};
  UIManagerAnimationDelegate *animationDelegate_{nullptr};
  RuntimeExecutor const runtimeExecutor_{};
  ShadowTreeRegistry shadowTreeRegistry_{};
  BackgroundExecutor const backgroundExecutor_{};
  ContextContainer::Shared contextContainer_;

  mutable std::shared_mutex commitHookMutex_;
  mutable std::vector<UIManagerCommitHook const *> commitHooks_;

  std::unique_ptr<LeakChecker> leakChecker_;
};

} // namespace ABI49_0_0facebook::ABI49_0_0React
