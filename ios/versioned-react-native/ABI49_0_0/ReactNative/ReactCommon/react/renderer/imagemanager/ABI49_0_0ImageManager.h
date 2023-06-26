/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI49_0_0React/renderer/core/ABI49_0_0ReactPrimitives.h>
#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageRequest.h>
#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0primitives.h>
#include <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class ImageManager;

using SharedImageManager = std::shared_ptr<ImageManager>;

/*
 * Cross platform facade for iOS-specific ABI49_0_0RCTImageManager.
 */
class ImageManager {
 public:
  ImageManager(ContextContainer::Shared const &contextContainer);
  ~ImageManager();

  ImageRequest requestImage(const ImageSource &imageSource, SurfaceId surfaceId)
      const;

 private:
  void *self_{};
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
