/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTResizeMode.h>

@interface UIImage (ABI48_0_0React)

/**
 * Memory bytes of the image with the default calculation of static image or GIF. Custom calculations of decoded bytes
 * can be assigned manually.
 */
@property (nonatomic, assign) NSInteger ABI48_0_0ReactDecodedImageBytes;

@end

/**
 * Provides an interface to use for providing a image caching strategy.
 */
@protocol ABI48_0_0RCTImageCache <NSObject>

- (UIImage *)imageForUrl:(NSString *)url size:(CGSize)size scale:(CGFloat)scale resizeMode:(ABI48_0_0RCTResizeMode)resizeMode;

- (void)addImageToCache:(UIImage *)image
                    URL:(NSString *)url
                   size:(CGSize)size
                  scale:(CGFloat)scale
             resizeMode:(ABI48_0_0RCTResizeMode)resizeMode
               response:(NSURLResponse *)response;

@end

@interface ABI48_0_0RCTImageCache : NSObject <ABI48_0_0RCTImageCache>

ABI48_0_0RCT_EXTERN void ABI48_0_0RCTSetImageCacheLimits(
    NSUInteger maxCachableDecodedImageSizeInBytes,
    NSUInteger imageCacheTotalCostLimit);

@end
