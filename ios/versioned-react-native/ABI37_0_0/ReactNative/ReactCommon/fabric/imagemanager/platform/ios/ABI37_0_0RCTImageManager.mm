/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTImageManager.h"

#import <ABI37_0_0React/debug/SystraceSection.h>
#import <ABI37_0_0React/utils/SharedFunction.h>

#import <ABI37_0_0React/ABI37_0_0RCTImageLoader.h>
#import <ABI37_0_0React/imagemanager/ImageResponse.h>
#import <ABI37_0_0React/imagemanager/ImageResponseObserver.h>

#import "ABI37_0_0RCTImagePrimitivesConversions.h"

using namespace ABI37_0_0facebook::ABI37_0_0React;

@implementation ABI37_0_0RCTImageManager {
  ABI37_0_0RCTImageLoader *_imageLoader;
  dispatch_queue_t _backgroundSerialQueue;
}

- (instancetype)initWithImageLoader:(ABI37_0_0RCTImageLoader *)imageLoader
{
  if (self = [super init]) {
    _imageLoader = imageLoader;
    _backgroundSerialQueue =
        dispatch_queue_create("com.facebook.ABI37_0_0React-native.image-manager-queue", DISPATCH_QUEUE_SERIAL);
  }

  return self;
}

- (ImageRequest)requestImage:(ImageSource)imageSource
{
  SystraceSection s("ABI37_0_0RCTImageManager::requestImage");

  auto imageRequest = ImageRequest(imageSource);
  auto weakObserverCoordinator =
      (std::weak_ptr<const ImageResponseObserverCoordinator>)imageRequest.getSharedObserverCoordinator();

  auto sharedCancelationFunction = SharedFunction<>();
  imageRequest.setCancelationFunction(sharedCancelationFunction);

  /*
   * Even if an image is being loaded asynchronously on some other background thread, some other preparation
   * work (such as creating an `NSURLRequest` object and some obscure logic inside `ABI37_0_0RCTImageLoader`) can take a couple
   * of milliseconds, so we have to offload this to a separate thread. `ImageRequest` can be created as part of the
   * layout process, so it must be highly performant.
   *
   * Technically, we don't need to dispatch this to *serial* queue. The interface of `ABI37_0_0RCTImageLoader` promises to be
   * fully thread-safe. However, in reality, it crashes when we request images on concurrently on different threads. See
   * T46024425 for more details.
   */
  dispatch_async(_backgroundSerialQueue, ^{
    NSURLRequest *request = NSURLRequestFromImageSource(imageSource);

    auto completionBlock = ^(NSError *error, UIImage *image) {
      auto observerCoordinator = weakObserverCoordinator.lock();
      if (!observerCoordinator) {
        return;
      }

      if (image && !error) {
        auto imageResponse = ImageResponse(std::shared_ptr<void>((__bridge_retained void *)image, CFRelease));
        observerCoordinator->nativeImageResponseComplete(std::move(imageResponse));
      } else {
        observerCoordinator->nativeImageResponseFailed();
      }
    };

    auto progressBlock = ^(int64_t progress, int64_t total) {
      auto observerCoordinator = weakObserverCoordinator.lock();
      if (!observerCoordinator) {
        return;
      }

      observerCoordinator->nativeImageResponseProgress(progress / (float)total);
    };

    ABI37_0_0RCTImageLoaderCancellationBlock cancelationBlock =
        [self->_imageLoader loadImageWithURLRequest:request
                                               size:CGSizeMake(imageSource.size.width, imageSource.size.height)
                                              scale:imageSource.scale
                                            clipped:YES
                                         resizeMode:ABI37_0_0RCTResizeModeStretch
                                      progressBlock:progressBlock
                                   partialLoadBlock:nil
                                    completionBlock:completionBlock];

    sharedCancelationFunction.assign([cancelationBlock]() { cancelationBlock(); });
  });

  return imageRequest;
}

@end
