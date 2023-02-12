/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/components/image/ImageShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ConcreteComponentDescriptor.h>
#include <ABI48_0_0React/ABI48_0_0renderer/imagemanager/ImageManager.h>
#include <ABI48_0_0React/ABI48_0_0utils/ContextContainer.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * Descriptor for <Image> component.
 */
class ImageComponentDescriptor final
    : public ConcreteComponentDescriptor<ImageShadowNode> {
 public:
  ImageComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor(parameters),
        imageManager_(std::make_shared<ImageManager>(contextContainer_)){};

  void adopt(ShadowNode::Unshared const &shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    auto imageShadowNode =
        std::static_pointer_cast<ImageShadowNode>(shadowNode);

    // `ImageShadowNode` uses `ImageManager` to initiate image loading and
    // communicate the loading state and results to mounting layer.
    imageShadowNode->setImageManager(imageManager_);
  }

 private:
  const SharedImageManager imageManager_;
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
