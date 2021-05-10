/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0RCTImageManagerProtocol.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI41_0_0RCTImageLoaderWithAttributionProtocol;

/**
 * iOS-specific ImageManager.
 */
@interface ABI41_0_0RCTSyncImageManager : NSObject <ABI41_0_0RCTImageManagerProtocol>

- (instancetype)initWithImageLoader:(id<ABI41_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader;

- (ABI41_0_0facebook::ABI41_0_0React::ImageRequest)requestImage:(ABI41_0_0facebook::ABI41_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI41_0_0facebook::ABI41_0_0React::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
