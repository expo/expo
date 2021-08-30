/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/components/image/ImageEventEmitter.h>
#include <ABI41_0_0React/components/image/ImageProps.h>
#include <ABI41_0_0React/components/image/ImageState.h>
#include <ABI41_0_0React/components/view/ConcreteViewShadowNode.h>
#include <ABI41_0_0React/imagemanager/ImageManager.h>
#include <ABI41_0_0React/imagemanager/primitives.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

extern const char ImageComponentName[];

/*
 * `ShadowNode` for <Image> component.
 */
class ImageShadowNode final : public ConcreteViewShadowNode<
                                  ImageComponentName,
                                  ImageProps,
                                  ImageEventEmitter,
                                  ImageState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  /*
   * Associates a shared `ImageManager` with the node.
   */
  void setImageManager(const SharedImageManager &imageManager);

  static ImageState initialStateData(
      ShadowNodeFragment const &fragment,
      SurfaceId const surfaceId,
      ComponentDescriptor const &componentDescriptor) {
    auto imageSource = ImageSource{ImageSource::Type::Invalid};
    return {imageSource, {imageSource, nullptr}};
  }

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

 private:
  ImageSource getImageSource() const;

  SharedImageManager imageManager_;

  void updateStateIfNeeded();
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
