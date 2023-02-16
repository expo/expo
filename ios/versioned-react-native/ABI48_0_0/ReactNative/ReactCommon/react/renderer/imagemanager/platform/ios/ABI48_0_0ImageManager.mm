/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0ImageManager.h"

#import <ABI48_0_0React/ABI48_0_0RCTImageLoaderWithAttributionProtocol.h>
#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>
#import <ABI48_0_0React/ABI48_0_0utils/ManagedObjectWrapper.h>

#import "ABI48_0_0RCTImageManager.h"
#import "ABI48_0_0RCTSyncImageManager.h"

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

ImageManager::ImageManager(ContextContainer::Shared const &contextContainer)
{
  id<ABI48_0_0RCTImageLoaderWithAttributionProtocol> imageLoader =
      (id<ABI48_0_0RCTImageLoaderWithAttributionProtocol>)unwrapManagedObject(
          contextContainer->at<std::shared_ptr<void>>("ABI48_0_0RCTImageLoader"));
  if (ABI48_0_0RCTRunningInTestEnvironment()) {
    self_ = (__bridge_retained void *)[[ABI48_0_0RCTSyncImageManager alloc] initWithImageLoader:imageLoader];
  } else {
    self_ = (__bridge_retained void *)[[ABI48_0_0RCTImageManager alloc] initWithImageLoader:imageLoader];
  }
}

ImageManager::~ImageManager()
{
  CFRelease(self_);
  self_ = nullptr;
}

ImageRequest ImageManager::requestImage(const ImageSource &imageSource, SurfaceId surfaceId) const
{
  ABI48_0_0RCTImageManager *imageManager = (__bridge ABI48_0_0RCTImageManager *)self_;
  return [imageManager requestImage:imageSource surfaceId:surfaceId];
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
