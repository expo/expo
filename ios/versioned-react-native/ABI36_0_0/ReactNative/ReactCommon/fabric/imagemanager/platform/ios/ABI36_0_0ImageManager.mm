/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI36_0_0ImageManager.h"

#import <ABI36_0_0React/ABI36_0_0RCTImageLoader.h>
#import <ABI36_0_0React/utils/ManagedObjectWrapper.h>

#import "ABI36_0_0RCTImageManager.h"

namespace ABI36_0_0facebook {
namespace ABI36_0_0React {

ImageManager::ImageManager(ContextContainer::Shared const &contextContainer)
{
  ABI36_0_0RCTImageLoader *imageLoader =
      (ABI36_0_0RCTImageLoader *)unwrapManagedObject(contextContainer->at<std::shared_ptr<void>>("ABI36_0_0RCTImageLoader"));
  self_ = (__bridge_retained void *)[[ABI36_0_0RCTImageManager alloc] initWithImageLoader:imageLoader];
}

ImageManager::~ImageManager()
{
  CFRelease(self_);
  self_ = nullptr;
}

ImageRequest ImageManager::requestImage(const ImageSource &imageSource) const
{
  ABI36_0_0RCTImageManager *imageManager = (__bridge ABI36_0_0RCTImageManager *)self_;
  return [imageManager requestImage:imageSource];
}

} // namespace ABI36_0_0React
} // namespace ABI36_0_0facebook
