/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI40_0_0RCTImageManagerProtocol.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI40_0_0RCTImageLoaderWithAttributionProtocol;

/**
 * iOS-specific ImageManager.
 */
@interface ABI40_0_0RCTImageManager : NSObject <ABI40_0_0RCTImageManagerProtocol>

- (instancetype)initWithImageLoader:(id<ABI40_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader;

- (ABI40_0_0facebook::ABI40_0_0React::ImageRequest)requestImage:(ABI40_0_0facebook::ABI40_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI40_0_0facebook::ABI40_0_0React::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
