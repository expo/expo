/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI31_0_0fabric/ABI31_0_0imagemanager/ImageRequest.h>
#include <ABI31_0_0fabric/ABI31_0_0imagemanager/primitives.h>

namespace facebook {
namespace ReactABI31_0_0 {

class ImageManager;

using SharedImageManager = std::shared_ptr<ImageManager>;

/*
 * Cross platform facade for iOS-specific ABI31_0_0RCTImageManager.
 */
class ImageManager {
public:

  ImageManager(void *platformSpecificCounterpart);
  ~ImageManager();

  ImageRequest requestImage(const ImageSource &imageSource) const;

private:
  void *self_;
};

} // namespace ReactABI31_0_0
} // namespace facebook
