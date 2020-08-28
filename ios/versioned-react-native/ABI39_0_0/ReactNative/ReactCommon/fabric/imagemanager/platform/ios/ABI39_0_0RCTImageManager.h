/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI39_0_0RCTImageManagerProtocol.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI39_0_0RCTImageLoaderWithAttributionProtocol;

/**
 * iOS-specific ImageManager.
 */
@interface ABI39_0_0RCTImageManager : NSObject <ABI39_0_0RCTImageManagerProtocol>

- (instancetype)initWithImageLoader:(id<ABI39_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader;

- (ABI39_0_0facebook::ABI39_0_0React::ImageRequest)requestImage:(ABI39_0_0facebook::ABI39_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI39_0_0facebook::ABI39_0_0React::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
