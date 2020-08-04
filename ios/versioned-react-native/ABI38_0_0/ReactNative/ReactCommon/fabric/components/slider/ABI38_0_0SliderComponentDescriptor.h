/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI38_0_0React/components/slider/SliderMeasurementsManager.h>
#include <ABI38_0_0React/components/slider/SliderShadowNode.h>
#include <ABI38_0_0React/core/ConcreteComponentDescriptor.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

/*
 * Descriptor for <Slider> component.
 */
class SliderComponentDescriptor final
    : public ConcreteComponentDescriptor<SliderShadowNode> {
 public:
  SliderComponentDescriptor(
      EventDispatcher::Weak eventDispatcher,
      ContextContainer::Shared const &contextContainer,
      ComponentDescriptor::Flavor const &flavor = {})
      : ConcreteComponentDescriptor(eventDispatcher, contextContainer, flavor),
        imageManager_(std::make_shared<ImageManager>(contextContainer)),
        measurementsManager_(
            SliderMeasurementsManager::shouldMeasureSlider()
                ? std::make_shared<SliderMeasurementsManager>(contextContainer)
                : nullptr) {}

  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<SliderShadowNode>(shadowNode));
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

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
