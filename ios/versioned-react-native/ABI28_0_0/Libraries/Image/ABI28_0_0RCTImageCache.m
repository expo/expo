/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTImageCache.h"

#import <objc/runtime.h>

#import <ImageIO/ImageIO.h>

#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTNetworking.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>

#import "ABI28_0_0RCTImageUtils.h"

static const NSUInteger ABI28_0_0RCTMaxCachableDecodedImageSizeInBytes = 1048576; // 1MB

static NSString *ABI28_0_0RCTCacheKeyForImage(NSString *imageTag, CGSize size, CGFloat scale,
                                     ABI28_0_0RCTResizeMode resizeMode, NSString *responseDate)
{
    return [NSString stringWithFormat:@"%@|%g|%g|%g|%lld|%@",
            imageTag, size.width, size.height, scale, (long long)resizeMode, responseDate];
}

@implementation ABI28_0_0RCTImageCache
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
  if (bytes <= ABI28_0_0RCTMaxCachableDecodedImageSizeInBytes) {
    [self->_decodedImageCache setObject:image
                                 forKey:cacheKey
                                   cost:bytes];
  }
}

- (UIImage *)imageForUrl:(NSString *)url
                    size:(CGSize)size
                   scale:(CGFloat)scale
              resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
            responseDate:(NSString *)responseDate
{
  NSString *cacheKey = ABI28_0_0RCTCacheKeyForImage(url, size, scale, resizeMode, responseDate);
  return [_decodedImageCache objectForKey:cacheKey];
}

- (void)addImageToCache:(UIImage *)image
                    URL:(NSString *)url
                   size:(CGSize)size
                  scale:(CGFloat)scale
             resizeMode:(ABI28_0_0RCTResizeMode)resizeMode
           responseDate:(NSString *)responseDate
{
  NSString *cacheKey = ABI28_0_0RCTCacheKeyForImage(url, size, scale, resizeMode, responseDate);
  return [self addImageToCache:image forKey:cacheKey];
}

@end
