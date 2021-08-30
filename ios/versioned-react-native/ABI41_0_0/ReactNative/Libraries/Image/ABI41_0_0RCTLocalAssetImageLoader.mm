/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTLocalAssetImageLoader.h>

#import <atomic>
#import <memory>

#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>
#import <ABI41_0_0ReactCommon/ABI41_0_0RCTTurboModule.h>

#import "ABI41_0_0RCTImagePlugins.h"

@interface ABI41_0_0RCTLocalAssetImageLoader() <ABI41_0_0RCTTurboModule>
@end

@implementation ABI41_0_0RCTLocalAssetImageLoader

ABI41_0_0RCT_EXPORT_MODULE()

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return ABI41_0_0RCTIsLocalAssetURL(requestURL);
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

 - (ABI41_0_0RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(ABI41_0_0RCTResizeMode)resizeMode
                                    progressHandler:(ABI41_0_0RCTImageLoaderProgressBlock)progressHandler
                                 partialLoadHandler:(ABI41_0_0RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                  completionHandler:(ABI41_0_0RCTImageLoaderCompletionBlock)completionHandler
{
  UIImage *image = ABI41_0_0RCTImageFromLocalAssetURL(imageURL);
  if (image) {
    if (progressHandler) {
      progressHandler(1, 1);
    }
    completionHandler(nil, image);
  } else {
    NSString *message = [NSString stringWithFormat:@"Could not find image %@", imageURL];
    ABI41_0_0RCTLogWarn(@"%@", message);
    completionHandler(ABI41_0_0RCTErrorWithMessage(message), nil);
  }
  
  return nil;
}

@end

Class ABI41_0_0RCTLocalAssetImageLoaderCls(void) {
  return ABI41_0_0RCTLocalAssetImageLoader.class;
}
