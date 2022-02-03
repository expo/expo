/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI44_0_0React/ABI44_0_0renderer/core/ABI44_0_0ReactPrimitives.h>
#import <ABI44_0_0React/ABI44_0_0renderer/imagemanager/ImageRequest.h>

@protocol ABI44_0_0RCTImageManagerProtocol <NSObject>

- (ABI44_0_0facebook::ABI44_0_0React::ImageRequest)requestImage:(ABI44_0_0facebook::ABI44_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI44_0_0facebook::ABI44_0_0React::SurfaceId)surfaceId;
@end
