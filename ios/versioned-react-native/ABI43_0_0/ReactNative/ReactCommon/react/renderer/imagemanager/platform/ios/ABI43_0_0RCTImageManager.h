/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0RCTImageManagerProtocol.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI43_0_0RCTImageLoaderWithAttributionProtocol;

/**
 * iOS-specific ImageManager.
 */
@interface ABI43_0_0RCTImageManager : NSObject <ABI43_0_0RCTImageManagerProtocol>

- (instancetype)initWithImageLoader:(id<ABI43_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader;

- (ABI43_0_0facebook::ABI43_0_0React::ImageRequest)requestImage:(ABI43_0_0facebook::ABI43_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI43_0_0facebook::ABI43_0_0React::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
