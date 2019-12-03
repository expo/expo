/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/image/ImageShadowNode.h>
#include <ReactABI34_0_0/core/ConcreteComponentDescriptor.h>
#include <ReactABI34_0_0/imagemanager/ImageManager.h>
#include <ReactABI34_0_0/uimanager/ContextContainer.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Descriptor for <Image> component.
 */
class ImageComponentDescriptor final
    : public ConcreteComponentDescriptor<ImageShadowNode> {
 public:
  ImageComponentDescriptor(
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

    assert(std::dynamic_pointer_cast<ImageShadowNode>(shadowNode));
    auto imageShadowNode =
        std::static_pointer_cast<ImageShadowNode>(shadowNode);

    // `ImageShadowNode` uses `ImageManager` to initiate image loading and
    // communicate the loading state and results to mounting layer.
    imageShadowNode->setImageManager(imageManager_);
  }

 private:
  const SharedImageManager imageManager_;
};

} // namespace ReactABI34_0_0
} // namespace facebook
