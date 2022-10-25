/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI47_0_0AndroidSwitchMeasurementsManager.h"
#include "ABI47_0_0AndroidSwitchShadowNode.h"

#include <ABI47_0_0React/ABI47_0_0renderer/core/ConcreteComponentDescriptor.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Descriptor for <AndroidSwitch> component.
 */
class AndroidSwitchComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidSwitchShadowNode> {
 public:
  AndroidSwitchComponentDescriptor(
      ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor(parameters),
        measurementsManager_(std::make_shared<AndroidSwitchMeasurementsManager>(
            contextContainer_)) {}

  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    auto androidSwitchShadowNode =
        std::static_pointer_cast<AndroidSwitchShadowNode>(shadowNode);

    // `AndroidSwitchShadowNode` uses `AndroidSwitchMeasurementsManager` to
    // provide measurements to Yoga.
    androidSwitchShadowNode->setAndroidSwitchMeasurementsManager(
        measurementsManager_);

    // All `AndroidSwitchShadowNode`s must have leaf Yoga nodes with properly
    // setup measure function.
    androidSwitchShadowNode->enableMeasurement();
  }

 private:
  const std::shared_ptr<AndroidSwitchMeasurementsManager> measurementsManager_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
