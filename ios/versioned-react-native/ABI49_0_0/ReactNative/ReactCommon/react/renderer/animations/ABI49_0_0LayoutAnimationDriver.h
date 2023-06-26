/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/animations/ABI49_0_0LayoutAnimationKeyFrameManager.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ReactPrimitives.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowViewMutation.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class LayoutAnimationDriver : public LayoutAnimationKeyFrameManager {
 public:
  LayoutAnimationDriver(
      RuntimeExecutor runtimeExecutor,
      ContextContainer::Shared &contextContainer,
      LayoutAnimationStatusDelegate *delegate)
      : LayoutAnimationKeyFrameManager(
            runtimeExecutor,
            contextContainer,
            delegate) {}

 protected:
  virtual void animationMutationsForFrame(
      SurfaceId surfaceId,
      ShadowViewMutation::List &mutationsList,
      uint64_t now) const override;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
