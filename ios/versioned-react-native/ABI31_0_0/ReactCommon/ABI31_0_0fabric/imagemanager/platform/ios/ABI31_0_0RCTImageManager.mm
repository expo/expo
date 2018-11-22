/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTImageManager.h"

#import <folly/futures/Future.h>
#import <folly/futures/Promise.h>

#import <ReactABI31_0_0/ABI31_0_0RCTImageLoader.h>

#import "ABI31_0_0RCTImagePrimitivesConversions.h"

using namespace facebook::ReactABI31_0_0;

@implementation ABI31_0_0RCTImageManager
{
  ABI31_0_0RCTImageLoader *_imageLoader;
}

- (instancetype)initWithImageLoader:(ABI31_0_0RCTImageLoader *)imageLoader
{
  if (self = [super init]) {
    _imageLoader = imageLoader;
  }

  return self;
}

- (ImageRequest)requestImage:(const ImageSource &)imageSource
{
  __block auto promise = folly::Promise<ImageResponse>();

  NSURLRequest *request = NSURLRequestFromImageSource(imageSource);

  auto completionBlock = ^(NSError *error, UIImage *image) {
    auto imageResponse = ImageResponse(std::shared_ptr<void>((__bridge_retained void *)image, CFRelease));
    promise.setValue(std::move(imageResponse));
  };

  auto interruptBlock = ^(const folly::exception_wrapper &exceptionWrapper) {
    if (!promise.isFulfilled()) {
      promise.setException(exceptionWrapper);
    }
  };

  ABI31_0_0RCTImageLoaderCancellationBlock cancellationBlock =
    [_imageLoader loadImageWithURLRequest:request
                                     size:CGSizeMake(imageSource.size.width, imageSource.size.height)
                                    scale:imageSource.scale
                                  clipped:YES
                               resizeMode:ABI31_0_0RCTResizeModeStretch
                            progressBlock:nil
                         partialLoadBlock:nil
                          completionBlock:completionBlock];

  promise.setInterruptHandler([cancellationBlock, interruptBlock](const folly::exception_wrapper &exceptionWrapper) {
    cancellationBlock();
    interruptBlock(exceptionWrapper);
  });

  return ImageRequest(imageSource, promise.getFuture());
}

@end
