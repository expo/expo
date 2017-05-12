/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTLocalAssetImageLoader.h"

#import <libkern/OSAtomic.h>

#import <ReactABI17_0_0/ABI17_0_0RCTUtils.h>

@implementation ABI17_0_0RCTLocalAssetImageLoader

ABI17_0_0RCT_EXPORT_MODULE()

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return ABI17_0_0RCTIsLocalAssetURL(requestURL);
}

- (BOOL)requiresScheduling
{
  // Don't schedule this loader on the URL queue so we can load the
  // local assets synchronously to avoid flickers.
  return NO;
}

- (BOOL)shouldCacheLoadedImages
{
  // UIImage imageNamed handles the caching automatically so we don't want
  // to add it to the image cache.
  return NO;
}

 - (ABI17_0_0RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(ABI17_0_0RCTResizeMode)resizeMode
                                    progressHandler:(ABI17_0_0RCTImageLoaderProgressBlock)progressHandler
                                 partialLoadHandler:(ABI17_0_0RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                  completionHandler:(ABI17_0_0RCTImageLoaderCompletionBlock)completionHandler
{
  __block volatile uint32_t cancelled = 0;
  ABI17_0_0RCTExecuteOnMainQueue(^{
    if (cancelled) {
      return;
    }

    UIImage *image = ABI17_0_0RCTImageFromLocalAssetURL(imageURL);
    if (image) {
      if (progressHandler) {
        progressHandler(1, 1);
      }
      completionHandler(nil, image);
    } else {
      NSString *message = [NSString stringWithFormat:@"Could not find image %@", imageURL];
      ABI17_0_0RCTLogWarn(@"%@", message);
      completionHandler(ABI17_0_0RCTErrorWithMessage(message), nil);
    }
  });

  return ^{
    OSAtomicOr32Barrier(1, &cancelled);
  };
}

@end
