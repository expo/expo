/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/imagemanager/ImageRequest.h>
#import <ABI37_0_0React/imagemanager/primitives.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI37_0_0RCTImageLoader;

/**
 * iOS-specific ImageManager.
 */
@interface ABI37_0_0RCTImageManager : NSObject

- (instancetype)initWithImageLoader:(ABI37_0_0RCTImageLoader *)imageLoader;

- (ABI37_0_0facebook::ABI37_0_0React::ImageRequest)requestImage:(ABI37_0_0facebook::ABI37_0_0React::ImageSource)imageSource;

@end

NS_ASSUME_NONNULL_END
