/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTImageCache.h"

#import <ImageIO/ImageIO.h>

#import <libkern/OSAtomic.h>

#import <objc/runtime.h>

#import "ABI10_0_0RCTConvert.h"
#import "ABI10_0_0RCTImageUtils.h"
#import "ABI10_0_0RCTNetworking.h"
#import "ABI10_0_0RCTUtils.h"

static const NSUInteger ABI10_0_0RCTMaxCachableDecodedImageSizeInBytes = 1048576; // 1MB

static NSString *ABI10_0_0RCTCacheKeyForImage(NSString *imageTag, CGSize size, CGFloat scale,
                                     ABI10_0_0RCTResizeMode resizeMode, NSString *responseDate)
{
    return [NSString stringWithFormat:@"%@|%g|%g|%g|%zd|%@",
            imageTag, size.width, size.height, scale, resizeMode, responseDate];
}

@implementation ABI10_0_0RCTImageCache
{
  NSOperationQueue *_imageDecodeQueue;
  NSCache *_decodedImageCache;
}

- (instancetype)init
{
  _decodedImageCache = [NSCache new];
  _decodedImageCache.totalCostLimit = 5 * 1024 * 1024; // 5MB

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(clearCache)
                                               name:UIApplicationDidReceiveMemoryWarningNotification
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(clearCache)
                                               name:UIApplicationWillResignActiveNotification
                                             object:nil];

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)clearCache
{
  [_decodedImageCache removeAllObjects];
}

- (void)addImageToCache:(UIImage *)image
                 forKey:(NSString *)cacheKey
{
  if (!image) {
    return;
  }
  CGFloat bytes = image.size.width * image.size.height * image.scale * image.scale * 4;
  if (bytes <= ABI10_0_0RCTMaxCachableDecodedImageSizeInBytes) {
    [self->_decodedImageCache setObject:image
                                 forKey:cacheKey
                                   cost:bytes];
  }
}

- (UIImage *)imageForUrl:(NSString *)url
                    size:(CGSize)size
                   scale:(CGFloat)scale
              resizeMode:(ABI10_0_0RCTResizeMode)resizeMode
            responseDate:(NSString *)responseDate
{
  NSString *cacheKey = ABI10_0_0RCTCacheKeyForImage(url, size, scale, resizeMode, responseDate);
  return [_decodedImageCache objectForKey:cacheKey];
}

- (void)addImageToCache:(UIImage *)image
                    URL:(NSString *)url
                   size:(CGSize)size
                  scale:(CGFloat)scale
             resizeMode:(ABI10_0_0RCTResizeMode)resizeMode
           responseDate:(NSString *)responseDate
{
  NSString *cacheKey = ABI10_0_0RCTCacheKeyForImage(url, size, scale, resizeMode, responseDate);
  return [self addImageToCache:image forKey:cacheKey];
}

@end
