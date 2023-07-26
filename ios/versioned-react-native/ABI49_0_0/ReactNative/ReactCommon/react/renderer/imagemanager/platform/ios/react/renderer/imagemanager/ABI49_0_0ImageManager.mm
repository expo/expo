/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageManager.h>

#import <ABI49_0_0React/ABI49_0_0RCTImageLoaderWithAttributionProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <ABI49_0_0React/utils/ABI49_0_0ManagedObjectWrapper.h>

#import "ABI49_0_0RCTImageManager.h"
#import "ABI49_0_0RCTSyncImageManager.h"

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

ImageManager::ImageManager(ContextContainer::Shared const &contextContainer)
{
  id<ABI49_0_0RCTImageLoaderWithAttributionProtocol> imageLoader =
      (id<ABI49_0_0RCTImageLoaderWithAttributionProtocol>)unwrapManagedObject(
          contextContainer->at<std::shared_ptr<void>>("ABI49_0_0RCTImageLoader"));
  if (ABI49_0_0RCTRunningInTestEnvironment()) {
    self_ = (__bridge_retained void *)[[ABI49_0_0RCTSyncImageManager alloc] initWithImageLoader:imageLoader];
  } else {
    self_ = (__bridge_retained void *)[[ABI49_0_0RCTImageManager alloc] initWithImageLoader:imageLoader];
  }
}

ImageManager::~ImageManager()
{
  CFRelease(self_);
  self_ = nullptr;
}

ImageRequest ImageManager::requestImage(const ImageSource &imageSource, SurfaceId surfaceId) const
{
  ABI49_0_0RCTImageManager *imageManager = (__bridge ABI49_0_0RCTImageManager *)self_;
  return [imageManager requestImage:imageSource surfaceId:surfaceId];
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
