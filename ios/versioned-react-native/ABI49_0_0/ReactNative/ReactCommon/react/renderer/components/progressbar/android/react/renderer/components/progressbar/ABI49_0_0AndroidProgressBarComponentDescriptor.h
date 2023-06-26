/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/core/ABI49_0_0ConcreteComponentDescriptor.h>
#include "ABI49_0_0AndroidProgressBarMeasurementsManager.h"
#include "ABI49_0_0AndroidProgressBarShadowNode.h"

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * Descriptor for <AndroidProgressBar> component.
 */
class AndroidProgressBarComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidProgressBarShadowNode> {
 public:
  AndroidProgressBarComponentDescriptor(
      ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor(parameters),
        measurementsManager_(
            std::make_shared<AndroidProgressBarMeasurementsManager>(
                contextContainer_)) {}

  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    auto androidProgressBarShadowNode =
        std::static_pointer_cast<AndroidProgressBarShadowNode>(shadowNode);

    // `AndroidProgressBarShadowNode` uses
    // `AndroidProgressBarMeasurementsManager` to provide measurements to Yoga.
    androidProgressBarShadowNode->setAndroidProgressBarMeasurementsManager(
        measurementsManager_);

    // All `AndroidProgressBarShadowNode`s must have leaf Yoga nodes with
    // properly setup measure function.
    androidProgressBarShadowNode->enableMeasurement();
  }

 private:
  const std::shared_ptr<AndroidProgressBarMeasurementsManager>
      measurementsManager_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
