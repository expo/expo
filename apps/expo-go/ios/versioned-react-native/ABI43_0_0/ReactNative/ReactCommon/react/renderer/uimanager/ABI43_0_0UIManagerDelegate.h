/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/core/ABI43_0_0ReactPrimitives.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ShadowNode.h>
#include <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingCoordinator.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

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
      MountingCoordinator::Shared const &mountingCoordinator) = 0;

  /*
   * Called each time when UIManager constructs a new Shadow Node. Receiver
   * might use this to optimistically allocate a new native view
   * instances.
   */
  virtual void uiManagerDidCreateShadowNode(
      const ShadowNode::Shared &shadowNode) = 0;

  /*
   * Called when UIManager wants to dispatch a command to the mounting layer.
   */
  virtual void uiManagerDidDispatchCommand(
      const ShadowNode::Shared &shadowNode,
      std::string const &commandName,
      folly::dynamic const args) = 0;

  /*
   * Set JS responder for a view
   */
  virtual void uiManagerDidSetJSResponder(
      SurfaceId surfaceId,
      ShadowNode::Shared const &shadowView,
      bool blockNativeResponder) = 0;

  /*
   * Clear the JSResponder for a view
   */
  virtual void uiManagerDidClearJSResponder() = 0;

  virtual ~UIManagerDelegate() noexcept = default;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
