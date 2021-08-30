/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI41_0_0React/core/ABI41_0_0ReactPrimitives.h>
#include <ABI41_0_0React/imagemanager/ImageRequest.h>
#include <ABI41_0_0React/imagemanager/primitives.h>
#include <ABI41_0_0React/utils/ContextContainer.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

class ImageManager;

using SharedImageManager = std::shared_ptr<ImageManager>;

/*
 * Cross platform facade for iOS-specific ABI41_0_0RCTImageManager.
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

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
