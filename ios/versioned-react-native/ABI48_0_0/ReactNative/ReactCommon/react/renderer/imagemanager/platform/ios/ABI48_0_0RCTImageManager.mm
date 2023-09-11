/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTImageManager.h"

#import <ABI48_0_0React/ABI48_0_0renderer/debug/SystraceSection.h>
#import <ABI48_0_0React/ABI48_0_0utils/ManagedObjectWrapper.h>
#import <ABI48_0_0React/ABI48_0_0utils/SharedFunction.h>

#import <ABI48_0_0React/ABI48_0_0RCTImageLoaderWithAttributionProtocol.h>

#import <ABI48_0_0React/ABI48_0_0renderer/imagemanager/ImageResponse.h>
#import <ABI48_0_0React/ABI48_0_0renderer/imagemanager/ImageResponseObserver.h>

#import "ABI48_0_0RCTImagePrimitivesConversions.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

@implementation ABI48_0_0RCTImageManager {
  id<ABI48_0_0RCTImageLoaderWithAttributionProtocol> _imageLoader;
  dispatch_queue_t _backgroundSerialQueue;
}

- (instancetype)initWithImageLoader:(id<ABI48_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader
{
  if (self = [super init]) {
    _imageLoader = imageLoader;
    _backgroundSerialQueue =
        dispatch_queue_create("com.facebook.ABI48_0_0React-native.image-manager-queue", DISPATCH_QUEUE_SERIAL);
  }

  return self;
}

- (ImageRequest)requestImage:(ImageSource)imageSource surfaceId:(SurfaceId)surfaceId
{
  SystraceSection s("ABI48_0_0RCTImageManager::requestImage");

  NSURLRequest *request = NSURLRequestFromImageSource(imageSource);
  std::shared_ptr<ImageTelemetry> telemetry;
  if ([self->_imageLoader shouldEnablePerfLoggingForRequestUrl:request.URL]) {
    telemetry = std::make_shared<ImageTelemetry>(surfaceId);
  } else {
    telemetry = nullptr;
  }

  auto imageRequest = ImageRequest(imageSource, telemetry);
  auto weakObserverCoordinator =
      (std::weak_ptr<const ImageResponseObserverCoordinator>)imageRequest.getSharedObserverCoordinator();

  auto sharedCancelationFunction = SharedFunction<>();
  imageRequest.setCancelationFunction(sharedCancelationFunction);

  /*
   * Even if an image is being loaded asynchronously on some other background thread, some other preparation
   * work (such as creating an `NSURLRequest` object and some obscure logic inside `ABI48_0_0RCTImageLoader`) can take a couple
   * of milliseconds, so we have to offload this to a separate thread. `ImageRequest` can be created as part of the
   * layout process, so it must be highly performant.
   *
   * Technically, we don't need to dispatch this to *serial* queue. The interface of `ABI48_0_0RCTImageLoader` promises to be
   * fully thread-safe. However, in reality, it crashes when we request images on concurrently on different threads. See
   * T46024425 for more details.
   */
  dispatch_async(_backgroundSerialQueue, ^{
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
                                            clipped:NO
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
  });

  return imageRequest;
}

@end
