/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI37_0_0React/components/image/ImageEventEmitter.h>
#include <ABI37_0_0React/components/image/ImageProps.h>
#include <ABI37_0_0React/components/view/ConcreteViewShadowNode.h>
#include <ABI37_0_0React/imagemanager/ImageManager.h>
#include <ABI37_0_0React/imagemanager/primitives.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

extern const char ImageComponentName[];

/*
 * `ShadowNode` for <Image> component.
 */
class ImageShadowNode final : public ConcreteViewShadowNode<
                                  ImageComponentName,
                                  ImageProps,
                                  ImageEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  /*
   * Associates a shared `ImageManager` with the node.
   */
  void setImageManager(const SharedImageManager &imageManager);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

 private:
  /*
   * (Re)Creates a `LocalData` object (with `ImageRequest`) if needed.
   */
  void updateLocalData();

  ImageSource getImageSource() const;

  SharedImageManager imageManager_;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
