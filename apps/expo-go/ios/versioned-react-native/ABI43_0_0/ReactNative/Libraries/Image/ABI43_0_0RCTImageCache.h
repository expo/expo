/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>

#import <ABI43_0_0React/ABI43_0_0RCTResizeMode.h>

@interface UIImage (ABI43_0_0React)

/**
 * Memory bytes of the image with the default calculation of static image or GIF. Custom calculations of decoded bytes can be assigned manually.
 */
@property (nonatomic, assign) NSInteger ABI43_0_0ReactDecodedImageBytes;

@end

/**
 * Provides an interface to use for providing a image caching strategy.
 */
@protocol ABI43_0_0RCTImageCache <NSObject>

- (UIImage *)imageForUrl:(NSString *)url
                    size:(CGSize)size
                   scale:(CGFloat)scale
              resizeMode:(ABI43_0_0RCTResizeMode)resizeMode;

- (void)addImageToCache:(UIImage *)image
                    URL:(NSString *)url
                   size:(CGSize)size
                  scale:(CGFloat)scale
             resizeMode:(ABI43_0_0RCTResizeMode)resizeMode
               response:(NSURLResponse *)response;

@end

@interface ABI43_0_0RCTImageCache : NSObject <ABI43_0_0RCTImageCache>
@end
