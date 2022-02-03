/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI43_0_0React/ABI43_0_0renderer/core/ABI43_0_0ReactPrimitives.h>
#import <ABI43_0_0React/ABI43_0_0renderer/imagemanager/ImageRequest.h>

@protocol ABI43_0_0RCTImageManagerProtocol <NSObject>

- (ABI43_0_0facebook::ABI43_0_0React::ImageRequest)requestImage:(ABI43_0_0facebook::ABI43_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI43_0_0facebook::ABI43_0_0React::SurfaceId)surfaceId;
@end
