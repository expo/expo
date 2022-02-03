/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/core/EventTarget.h>
#include <ABI43_0_0React/ABI43_0_0renderer/mounting/Differentiator.h>
#include <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingCoordinator.h>
#include <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingOverrideDelegate.h>
#include <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingTransaction.h>
#include <ABI43_0_0React/ABI43_0_0renderer/uimanager/UIManagerAnimationDelegate.h>

#include <folly/dynamic.h>

#include "ABI43_0_0LayoutAnimationKeyFrameManager.h"

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class LayoutAnimationDriver : public LayoutAnimationKeyFrameManager {
 public:
  LayoutAnimationDriver(
      RuntimeExecutor runtimeExecutor,
      LayoutAnimationStatusDelegate *delegate)
      : LayoutAnimationKeyFrameManager(runtimeExecutor, delegate) {}

  virtual ~LayoutAnimationDriver() {}

 protected:
  virtual void animationMutationsForFrame(
      SurfaceId surfaceId,
      ShadowViewMutation::List &mutationsList,
      uint64_t now) const override;
  virtual double getProgressThroughAnimation(
      AnimationKeyFrame const &keyFrame,
      LayoutAnimation const *layoutAnimation,
      ShadowView const &animationStateView) const override;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
