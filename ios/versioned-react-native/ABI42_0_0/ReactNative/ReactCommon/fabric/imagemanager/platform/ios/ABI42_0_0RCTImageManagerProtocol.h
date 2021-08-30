/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI42_0_0React/core/ABI42_0_0ReactPrimitives.h>
#import <ABI42_0_0React/imagemanager/ImageRequest.h>

@protocol ABI42_0_0RCTImageManagerProtocol <NSObject>

- (ABI42_0_0facebook::ABI42_0_0React::ImageRequest)requestImage:(ABI42_0_0facebook::ABI42_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI42_0_0facebook::ABI42_0_0React::SurfaceId)surfaceId;
@end
