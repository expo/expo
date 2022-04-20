/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI45_0_0React/ABI45_0_0renderer/core/ABI45_0_0ReactPrimitives.h>
#import <ABI45_0_0React/ABI45_0_0renderer/imagemanager/ImageRequest.h>

@protocol ABI45_0_0RCTImageManagerProtocol <NSObject>

- (ABI45_0_0facebook::ABI45_0_0React::ImageRequest)requestImage:(ABI45_0_0facebook::ABI45_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI45_0_0facebook::ABI45_0_0React::SurfaceId)surfaceId;
@end
