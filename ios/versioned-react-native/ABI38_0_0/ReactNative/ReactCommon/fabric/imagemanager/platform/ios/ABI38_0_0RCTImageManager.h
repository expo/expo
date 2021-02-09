/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/core/ABI38_0_0ReactPrimitives.h>
#import <ABI38_0_0React/imagemanager/ImageRequest.h>
#import <ABI38_0_0React/imagemanager/primitives.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI38_0_0RCTImageLoaderWithAttributionProtocol;

/**
 * iOS-specific ImageManager.
 */
@interface ABI38_0_0RCTImageManager : NSObject

- (instancetype)initWithImageLoader:(id<ABI38_0_0RCTImageLoaderWithAttributionProtocol>)imageLoader;

- (ABI38_0_0facebook::ABI38_0_0React::ImageRequest)requestImage:(ABI38_0_0facebook::ABI38_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI38_0_0facebook::ABI38_0_0React::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
