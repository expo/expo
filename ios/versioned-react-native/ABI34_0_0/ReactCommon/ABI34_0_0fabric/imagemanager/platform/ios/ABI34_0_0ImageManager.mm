/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0ImageManager.h"

#import <ReactABI34_0_0/ABI34_0_0RCTImageLoader.h>

#import "ABI34_0_0RCTImageManager.h"

namespace facebook {
namespace ReactABI34_0_0 {

ImageManager::ImageManager(void *platformSpecificCounterpart) {
  self_ = (__bridge_retained void *)[[ABI34_0_0RCTImageManager alloc]
      initWithImageLoader:(__bridge ABI34_0_0RCTImageLoader *)
                              platformSpecificCounterpart];
}

ImageManager::~ImageManager() {
  CFRelease(self_);
  self_ = nullptr;
}

ImageRequest ImageManager::requestImage(const ImageSource &imageSource) const {
  ABI34_0_0RCTImageManager *imageManager = (__bridge ABI34_0_0RCTImageManager *)self_;
  return [imageManager requestImage:imageSource];
}

} // namespace ReactABI34_0_0
} // namespace facebook
