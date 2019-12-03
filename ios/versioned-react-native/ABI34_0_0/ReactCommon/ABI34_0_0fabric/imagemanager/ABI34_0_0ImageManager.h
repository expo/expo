/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ReactABI34_0_0/imagemanager/ImageRequest.h>
#include <ReactABI34_0_0/imagemanager/primitives.h>

namespace facebook {
namespace ReactABI34_0_0 {

class ImageManager;

using SharedImageManager = std::shared_ptr<ImageManager>;

/*
 * Cross platform facade for iOS-specific ABI34_0_0RCTImageManager.
 */
class ImageManager {
 public:
  ImageManager(void *platformSpecificCounterpart);
  ~ImageManager();

  ImageRequest requestImage(const ImageSource &imageSource) const;

 private:
  void *self_;
};

} // namespace ReactABI34_0_0
} // namespace facebook
