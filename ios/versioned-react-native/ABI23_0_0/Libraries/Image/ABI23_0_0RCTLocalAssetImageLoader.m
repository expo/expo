/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTLocalAssetImageLoader.h"

#import <stdatomic.h>

#import <ReactABI23_0_0/ABI23_0_0RCTUtils.h>

@implementation ABI23_0_0RCTLocalAssetImageLoader

ABI23_0_0RCT_EXPORT_MODULE()

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return ABI23_0_0RCTIsLocalAssetURL(requestURL);
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

 - (ABI23_0_0RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(ABI23_0_0RCTResizeMode)resizeMode
                                    progressHandler:(ABI23_0_0RCTImageLoaderProgressBlock)progressHandler
                                 partialLoadHandler:(ABI23_0_0RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                  completionHandler:(ABI23_0_0RCTImageLoaderCompletionBlock)completionHandler
{
  __block atomic_bool cancelled = ATOMIC_VAR_INIT(NO);
  ABI23_0_0RCTExecuteOnMainQueue(^{
    if (atomic_load(&cancelled)) {
      return;
    }

    UIImage *image = ABI23_0_0RCTImageFromLocalAssetURL(imageURL);
    if (image) {
      if (progressHandler) {
        progressHandler(1, 1);
      }
      completionHandler(nil, image);
    } else {
      NSString *message = [NSString stringWithFormat:@"Could not find image %@", imageURL];
      ABI23_0_0RCTLogWarn(@"%@", message);
      completionHandler(ABI23_0_0RCTErrorWithMessage(message), nil);
    }
  });

  return ^{
    atomic_store(&cancelled, YES);
  };
}

@end
