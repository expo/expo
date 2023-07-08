/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI49_0_0React/renderer/core/ABI49_0_0ReactPrimitives.h>
#import <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageRequest.h>

@protocol ABI49_0_0RCTImageManagerProtocol <NSObject>

- (ABI49_0_0facebook::ABI49_0_0React::ImageRequest)requestImage:(ABI49_0_0facebook::ABI49_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI49_0_0facebook::ABI49_0_0React::SurfaceId)surfaceId;
@end
