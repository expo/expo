/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/components/slider/SliderMeasurementsManager.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/slider/SliderShadowNode.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ConcreteComponentDescriptor.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Descriptor for <Slider> component.
 */
class SliderComponentDescriptor final
    : public ConcreteComponentDescriptor<SliderShadowNode> {
 public:
  SliderComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor(parameters),
        imageManager_(std::make_shared<ImageManager>(contextContainer_)),
        measurementsManager_(
            SliderMeasurementsManager::shouldMeasureSlider()
                ? std::make_shared<SliderMeasurementsManager>(contextContainer_)
                : nullptr) {}

  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    auto sliderShadowNode =
        std::static_pointer_cast<SliderShadowNode>(shadowNode);

    // `SliderShadowNode` uses `ImageManager` to initiate image loading and
    // communicate the loading state and results to mounting layer.
    sliderShadowNode->setImageManager(imageManager_);

    if (measurementsManager_) {
      // `SliderShadowNode` uses `SliderMeasurementsManager` to
      // provide measurements to Yoga.
      sliderShadowNode->setSliderMeasurementsManager(measurementsManager_);

      // All `SliderShadowNode`s must have leaf Yoga nodes with properly
      // setup measure function.
      sliderShadowNode->enableMeasurement();
    }
  }

 private:
  const SharedImageManager imageManager_;
  const std::shared_ptr<SliderMeasurementsManager> measurementsManager_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
