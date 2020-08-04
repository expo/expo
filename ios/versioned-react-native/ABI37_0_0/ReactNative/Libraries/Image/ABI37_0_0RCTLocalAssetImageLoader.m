/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTLocalAssetImageLoader.h>

#import <stdatomic.h>

#import <ABI37_0_0React/ABI37_0_0RCTUtils.h>

@implementation ABI37_0_0RCTLocalAssetImageLoader

ABI37_0_0RCT_EXPORT_MODULE()

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return ABI37_0_0RCTIsLocalAssetURL(requestURL);
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

 - (ABI37_0_0RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(ABI37_0_0RCTResizeMode)resizeMode
                                    progressHandler:(ABI37_0_0RCTImageLoaderProgressBlock)progressHandler
                                 partialLoadHandler:(ABI37_0_0RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                  completionHandler:(ABI37_0_0RCTImageLoaderCompletionBlock)completionHandler
{
  __block atomic_bool cancelled = ATOMIC_VAR_INIT(NO);
  ABI37_0_0RCTExecuteOnMainQueue(^{
    if (atomic_load(&cancelled)) {
      return;
    }

    UIImage *image = ABI37_0_0RCTImageFromLocalAssetURL(imageURL);
    if (image) {
      if (progressHandler) {
        progressHandler(1, 1);
      }
      completionHandler(nil, image);
    } else {
      NSString *message = [NSString stringWithFormat:@"Could not find image %@", imageURL];
      ABI37_0_0RCTLogWarn(@"%@", message);
      completionHandler(ABI37_0_0RCTErrorWithMessage(message), nil);
    }
  });

  return ^{
    atomic_store(&cancelled, YES);
  };
}

@end
