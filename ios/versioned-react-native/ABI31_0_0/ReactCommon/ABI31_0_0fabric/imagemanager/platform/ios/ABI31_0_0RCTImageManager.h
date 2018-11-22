/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI31_0_0fabric/ABI31_0_0imagemanager/ImageRequest.h>
#import <ABI31_0_0fabric/ABI31_0_0imagemanager/primitives.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI31_0_0RCTImageLoader;

/**
 * iOS-specific ImageManager.
 */
@interface ABI31_0_0RCTImageManager : NSObject

- (instancetype)initWithImageLoader:(ABI31_0_0RCTImageLoader *)imageLoader;

- (facebook::ReactABI31_0_0::ImageRequest)requestImage:(const facebook::ReactABI31_0_0::ImageSource &)imageSource;

@end

NS_ASSUME_NONNULL_END
