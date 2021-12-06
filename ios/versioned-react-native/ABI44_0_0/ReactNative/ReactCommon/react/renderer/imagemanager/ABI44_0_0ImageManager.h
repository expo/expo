/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI44_0_0React/ABI44_0_0renderer/core/ABI44_0_0ReactPrimitives.h>
#include <ABI44_0_0React/ABI44_0_0renderer/imagemanager/ImageRequest.h>
#include <ABI44_0_0React/ABI44_0_0renderer/imagemanager/primitives.h>
#include <ABI44_0_0React/ABI44_0_0utils/ContextContainer.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

class ImageManager;

using SharedImageManager = std::shared_ptr<ImageManager>;

/*
 * Cross platform facade for iOS-specific ABI44_0_0RCTImageManager.
 */
class ImageManager {
 public:
  ImageManager(ContextContainer::Shared const &contextContainer);
  ~ImageManager();

  ImageRequest requestImage(const ImageSource &imageSource, SurfaceId surfaceId)
      const;

 private:
  void *self_;
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
