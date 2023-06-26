/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/core/ABI49_0_0ReactPrimitives.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0MountingCoordinator.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

/*
 * Abstract class for UIManager's delegate.
 */
class UIManagerDelegate {
 public:
  /*
   * Called right after a new/updated Shadow Node tree is constructed.
   * For this moment the tree is already laid out and sealed.
   */
  virtual void uiManagerDidFinishTransaction(
      MountingCoordinator::Shared mountingCoordinator,
      bool mountSynchronously) = 0;

  /*
   * Called each time when UIManager constructs a new Shadow Node. Receiver
   * might use this to optimistically allocate a new native view
   * instances.
   */
  virtual void uiManagerDidCreateShadowNode(const ShadowNode &shadowNode) = 0;

  /*
   * Called when UIManager wants to dispatch a command to the mounting layer.
   */
  virtual void uiManagerDidDispatchCommand(
      const ShadowNode::Shared &shadowNode,
      std::string const &commandName,
      folly::dynamic const &args) = 0;

  /*
   * Called when UIManager wants to dispatch some accessibility event
   * to the mounting layer. eventType is platform-specific and not all
   * platforms will necessarily implement the same set of events.
   */
  virtual void uiManagerDidSendAccessibilityEvent(
      const ShadowNode::Shared &shadowNode,
      std::string const &eventType) = 0;

  /*
   * Set JS responder for a view.
   */
  virtual void uiManagerDidSetIsJSResponder(
      ShadowNode::Shared const &shadowNode,
      bool isJSResponder,
      bool blockNativeResponder) = 0;

  virtual ~UIManagerDelegate() noexcept = default;
};

} // namespace ABI49_0_0facebook::ABI49_0_0React
