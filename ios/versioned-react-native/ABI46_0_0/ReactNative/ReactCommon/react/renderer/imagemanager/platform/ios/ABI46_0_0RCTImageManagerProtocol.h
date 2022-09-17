/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI46_0_0React/ABI46_0_0renderer/core/ABI46_0_0ReactPrimitives.h>
#import <ABI46_0_0React/ABI46_0_0renderer/imagemanager/ImageRequest.h>

@protocol ABI46_0_0RCTImageManagerProtocol <NSObject>

- (ABI46_0_0facebook::ABI46_0_0React::ImageRequest)requestImage:(ABI46_0_0facebook::ABI46_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI46_0_0facebook::ABI46_0_0React::SurfaceId)surfaceId;
@end
