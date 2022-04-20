/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI45_0_0RCTImageManagerProtocol.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI45_0_0RCTImageLoaderWithAttributionProtocol;

/**
 * iOS-specific ImageManager.
 */
@interface ABI45_0_0RCTImageManager : NSObject <ABI45_0_0RCTImageManagerProtocol>

- (instancetype)initWithImageLoader:(id<ABI45_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader;

- (ABI45_0_0facebook::ABI45_0_0React::ImageRequest)requestImage:(ABI45_0_0facebook::ABI45_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI45_0_0facebook::ABI45_0_0React::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
