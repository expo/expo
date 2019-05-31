/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI33_0_0/core/ReactABI33_0_0Primitives.h>
#include <ReactABI33_0_0/core/ShadowNode.h>

namespace facebook {
namespace ReactABI33_0_0 {

/*
 * Abstract class for UIManager's delegate.
 */
class UIManagerDelegate {
 public:
  /*
   * Called right after the new/updated Shadow Node tree is constructed.
   * The tree is not layed out and not sealed at this time.
   */
  virtual void uiManagerDidFinishTransaction(
      SurfaceId surfaceId,
      const SharedShadowNodeUnsharedList &rootChildNodes,
      long startCommitTime) = 0;

  /*
   * Called each time when UIManager constructs a new Shadow Node. Receiver
   * maight use this to preluminary optimistically allocate a new native view
   * instances.
   */
  virtual void uiManagerDidCreateShadowNode(
      const SharedShadowNode &shadowNode) = 0;

  virtual ~UIManagerDelegate() noexcept = default;
};

} // namespace ReactABI33_0_0
} // namespace facebook
