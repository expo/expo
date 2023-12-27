/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0RCTImageManagerProtocol.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0RCTImageLoaderWithAttributionProtocol;

/**
 * iOS-specific ImageManager.
 */
@interface ABI42_0_0RCTSyncImageManager : NSObject <ABI42_0_0RCTImageManagerProtocol>

- (instancetype)initWithImageLoader:(id<ABI42_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader;

- (ABI42_0_0facebook::ABI42_0_0React::ImageRequest)requestImage:(ABI42_0_0facebook::ABI42_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI42_0_0facebook::ABI42_0_0React::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
