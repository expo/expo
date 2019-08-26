/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0components/image/ImageShadowNode.h>
#include <ABI31_0_0fabric/ABI31_0_0core/ConcreteComponentDescriptor.h>
#include <ABI31_0_0fabric/ABI31_0_0imagemanager/ImageManager.h>
#include <ABI31_0_0fabric/ABI31_0_0uimanager/ContextContainer.h>

namespace facebook {
namespace ReactABI31_0_0 {

/*
 * Descriptor for <Image> component.
 */
class ImageComponentDescriptor final:
  public ConcreteComponentDescriptor<ImageShadowNode> {

public:
  ImageComponentDescriptor(SharedEventDispatcher eventDispatcher, const SharedContextContainer &contextContainer):
    ConcreteComponentDescriptor(eventDispatcher),
    imageManager_(contextContainer->getInstance<SharedImageManager>()) {}

  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<ImageShadowNode>(shadowNode));
    auto imageShadowNode = std::static_pointer_cast<ImageShadowNode>(shadowNode);

    // `ImageShadowNode` uses `ImageManager` to initiate image loading and
    // communicate the loading state and results to mounting layer.
    imageShadowNode->setImageManager(imageManager_);
  }

private:
  const SharedImageManager imageManager_;
};

} // namespace ReactABI31_0_0
} // namespace facebook

