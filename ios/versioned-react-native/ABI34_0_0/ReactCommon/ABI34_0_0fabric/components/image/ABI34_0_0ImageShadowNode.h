/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/components/image/ImageEventEmitter.h>
#include <ReactABI34_0_0/components/image/ImageProps.h>
#include <ReactABI34_0_0/components/view/ConcreteViewShadowNode.h>
#include <ReactABI34_0_0/imagemanager/ImageManager.h>
#include <ReactABI34_0_0/imagemanager/primitives.h>

namespace facebook {
namespace ReactABI34_0_0 {

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

} // namespace ReactABI34_0_0
} // namespace facebook
