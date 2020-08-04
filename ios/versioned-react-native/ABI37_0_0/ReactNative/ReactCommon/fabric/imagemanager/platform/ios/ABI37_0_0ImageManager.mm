/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0ImageManager.h"

#import <ABI37_0_0React/ABI37_0_0RCTImageLoader.h>
#import <ABI37_0_0React/utils/ManagedObjectWrapper.h>

#import "ABI37_0_0RCTImageManager.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

ImageManager::ImageManager(ContextContainer::Shared const &contextContainer)
{
  ABI37_0_0RCTImageLoader *imageLoader =
      (ABI37_0_0RCTImageLoader *)unwrapManagedObject(contextContainer->at<std::shared_ptr<void>>("ABI37_0_0RCTImageLoader"));
  self_ = (__bridge_retained void *)[[ABI37_0_0RCTImageManager alloc] initWithImageLoader:imageLoader];
}

ImageManager::~ImageManager()
{
  CFRelease(self_);
  self_ = nullptr;
}

ImageRequest ImageManager::requestImage(const ImageSource &imageSource) const
{
  ABI37_0_0RCTImageManager *imageManager = (__bridge ABI37_0_0RCTImageManager *)self_;
  return [imageManager requestImage:imageSource];
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
