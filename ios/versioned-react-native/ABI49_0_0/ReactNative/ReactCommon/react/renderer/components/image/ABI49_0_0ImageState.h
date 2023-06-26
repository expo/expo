/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageRequest.h>
#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0primitives.h>

#ifdef ANDROID
#include <ABI49_0_0React/renderer/mapbuffer/ABI49_0_0MapBuffer.h>
#include <ABI49_0_0React/renderer/mapbuffer/ABI49_0_0MapBufferBuilder.h>
#endif

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * State for <Image> component.
 */
class ImageState final {
 public:
  ImageState(
      ImageSource const &imageSource,
      ImageRequest imageRequest,
      Float const blurRadius)
      : imageSource_(imageSource),
        imageRequest_(std::make_shared<ImageRequest>(std::move(imageRequest))),
        blurRadius_(blurRadius){};

  /*
   * Returns stored ImageSource object.
   */
  ImageSource getImageSource() const;

  /*
   * Exposes for reading stored `ImageRequest` object.
   * `ImageRequest` object cannot be copied or moved from `ImageLocalData`.
   */
  ImageRequest const &getImageRequest() const;

  Float getBlurRadius() const;

#ifdef ANDROID
  ImageState(ImageState const &previousState, folly::dynamic data)
      : blurRadius_{0} {};

  /*
   * Empty implementation for Android because it doesn't use this class.
   */
  folly::dynamic getDynamic() const {
    return {};
  };

  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  };
#endif

 private:
  ImageSource imageSource_;
  std::shared_ptr<ImageRequest> imageRequest_;
  Float const blurRadius_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
