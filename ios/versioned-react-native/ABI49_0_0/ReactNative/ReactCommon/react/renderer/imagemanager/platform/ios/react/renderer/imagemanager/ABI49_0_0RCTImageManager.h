/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "ABI49_0_0RCTImageManagerProtocol.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ABI49_0_0RCTImageLoaderWithAttributionProtocol;

/**
 * iOS-specific ImageManager.
 */
@interface ABI49_0_0RCTImageManager : NSObject <ABI49_0_0RCTImageManagerProtocol>

- (instancetype)initWithImageLoader:(id<ABI49_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader;

- (ABI49_0_0facebook::ABI49_0_0React::ImageRequest)requestImage:(ABI49_0_0facebook::ABI49_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI49_0_0facebook::ABI49_0_0React::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
