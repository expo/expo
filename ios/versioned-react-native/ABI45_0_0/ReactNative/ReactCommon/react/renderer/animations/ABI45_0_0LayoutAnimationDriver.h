/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0React/ABI45_0_0renderer/animations/LayoutAnimationKeyFrameManager.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/ABI45_0_0ReactPrimitives.h>
#include <ABI45_0_0React/ABI45_0_0renderer/mounting/ShadowViewMutation.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

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

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
