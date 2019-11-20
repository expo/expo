/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/slider/SliderShadowNode.h>
#include <ReactABI34_0_0/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Descriptor for <Slider> component.
 */
class SliderComponentDescriptor final
    : public ConcreteComponentDescriptor<SliderShadowNode> {
 public:
  SliderComponentDescriptor(
      SharedEventDispatcher eventDispatcher,
      const SharedContextContainer &contextContainer)
      : ConcreteComponentDescriptor(eventDispatcher),
        imageManager_(
            contextContainer
                ? contextContainer->getInstance<SharedImageManager>(
                      "ImageManager")
                : nullptr) {}

  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<SliderShadowNode>(shadowNode));
    auto sliderShadowNode =
        std::static_pointer_cast<SliderShadowNode>(shadowNode);

    // `SliderShadowNode` uses `ImageManager` to initiate image loading and
    // communicate the loading state and results to mounting layer.
    sliderShadowNode->setImageManager(imageManager_);
  }

 private:
  const SharedImageManager imageManager_;
};

} // namespace ReactABI34_0_0
} // namespace facebook
