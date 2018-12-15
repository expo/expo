/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI32_0_0ImageManager.h"

#import <ReactABI32_0_0/ABI32_0_0RCTImageLoader.h>

#import "ABI32_0_0RCTImageManager.h"

namespace facebook {
namespace ReactABI32_0_0 {

ImageManager::ImageManager(void *platformSpecificCounterpart) {
  self_ = (__bridge_retained void *)[[ABI32_0_0RCTImageManager alloc] initWithImageLoader:(__bridge_transfer ABI32_0_0RCTImageLoader *)platformSpecificCounterpart];
}

ImageManager::~ImageManager() {
  CFRelease(self_);
  self_ = nullptr;
}

ImageRequest ImageManager::requestImage(const ImageSource &imageSource) const {
  ABI32_0_0RCTImageManager *imageManager = (__bridge ABI32_0_0RCTImageManager *)self_;
  return [imageManager requestImage:imageSource];
}

} // namespace ReactABI32_0_0
} // namespace facebook
