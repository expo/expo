/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTSyncImageManager.h"

#import <ABI48_0_0React/ABI48_0_0utils/ManagedObjectWrapper.h>
#import <ABI48_0_0React/ABI48_0_0utils/SharedFunction.h>

#import <ABI48_0_0React/ABI48_0_0RCTAssert.h>
#import <ABI48_0_0React/ABI48_0_0RCTImageLoaderWithAttributionProtocol.h>
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>
#import <ABI48_0_0React/ABI48_0_0renderer/imagemanager/ImageResponse.h>
#import <ABI48_0_0React/ABI48_0_0renderer/imagemanager/ImageResponseObserver.h>

#import "ABI48_0_0RCTImagePrimitivesConversions.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

@implementation ABI48_0_0RCTSyncImageManager {
  id<ABI48_0_0RCTImageLoaderWithAttributionProtocol> _imageLoader;
}

- (instancetype)initWithImageLoader:(id<ABI48_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader
{
  if (self = [super init]) {
    ABI48_0_0RCTAssert(ABI48_0_0RCTRunningInTestEnvironment(), @"This class is only meant to be used in test environment");
    _imageLoader = imageLoader;
  }

  return self;
}

- (ImageRequest)requestImage:(ImageSource)imageSource surfaceId:(SurfaceId)surfaceId
{
  auto telemetry = std::make_shared<ImageTelemetry>(surfaceId);
  auto imageRequest = ImageRequest(imageSource, telemetry);
  auto weakObserverCoordinator =
      (std::weak_ptr<const ImageResponseObserverCoordinator>)imageRequest.getSharedObserverCoordinator();

  auto sharedCancelationFunction = SharedFunction<>();
  imageRequest.setCancelationFunction(sharedCancelationFunction);

  dispatch_group_t imageWaitGroup = dispatch_group_create();

  dispatch_group_enter(imageWaitGroup);

  NSURLRequest *request = NSURLRequestFromImageSource(imageSource);

  auto completionBlock = ^(NSError *error, UIImage *image, id metadata) {
    auto observerCoordinator = weakObserverCoordinator.lock();
    if (!observerCoordinator) {
      return;
    }

    if (image && !error) {
      auto wrappedMetadata = metadata ? wrapManagedObject(metadata) : nullptr;
      observerCoordinator->nativeImageResponseComplete(ImageResponse(wrapManagedObject(image), wrappedMetadata));
    } else {
      observerCoordinator->nativeImageResponseFailed();
    }
    dispatch_group_leave(imageWaitGroup);
  };

  auto progressBlock = ^(int64_t progress, int64_t total) {
    auto observerCoordinator = weakObserverCoordinator.lock();
    if (!observerCoordinator) {
      return;
    }

    observerCoordinator->nativeImageResponseProgress((float)progress / (float)total);
  };

  ABI48_0_0RCTImageURLLoaderRequest *loaderRequest =
      [self->_imageLoader loadImageWithURLRequest:request
                                             size:CGSizeMake(imageSource.size.width, imageSource.size.height)
                                            scale:imageSource.scale
                                          clipped:YES
                                       resizeMode:ABI48_0_0RCTResizeModeStretch
                                         priority:ABI48_0_0RCTImageLoaderPriorityImmediate
                                      attribution:{
                                                      .surfaceId = surfaceId,
                                                  }
                                    progressBlock:progressBlock
                                 partialLoadBlock:nil
                                  completionBlock:completionBlock];
  ABI48_0_0RCTImageLoaderCancellationBlock cancelationBlock = loaderRequest.cancellationBlock;
  sharedCancelationFunction.assign([cancelationBlock]() { cancelationBlock(); });

  auto result = dispatch_group_wait(imageWaitGroup, dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC));
  if (result != 0) {
    ABI48_0_0RCTLogError(@"Image timed out in test environment for url: %@", loaderRequest.imageURL);
  }
  return imageRequest;
}

@end
