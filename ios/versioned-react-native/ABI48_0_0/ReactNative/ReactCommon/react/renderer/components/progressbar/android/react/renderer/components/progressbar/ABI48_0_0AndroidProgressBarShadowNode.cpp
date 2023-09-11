/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0AndroidProgressBarShadowNode.h"

#include <ABI48_0_0React/ABI48_0_0renderer/components/progressbar/AndroidProgressBarShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/LayoutContext.h>

namespace ABI48_0_0facebook::ABI48_0_0React {

extern const char AndroidProgressBarComponentName[] = "AndroidProgressBar";

void AndroidProgressBarShadowNode::setAndroidProgressBarMeasurementsManager(
    const std::shared_ptr<AndroidProgressBarMeasurementsManager>
        &measurementsManager) {
  ensureUnsealed();
  measurementsManager_ = measurementsManager;
}

#pragma mark - LayoutableShadowNode

Size AndroidProgressBarShadowNode::measureContent(
    LayoutContext const & /*layoutContext*/,
    LayoutConstraints const &layoutConstraints) const {
  return measurementsManager_->measure(
      getSurfaceId(), getConcreteProps(), layoutConstraints);
}

} // namespace ABI48_0_0facebook::ABI48_0_0React
