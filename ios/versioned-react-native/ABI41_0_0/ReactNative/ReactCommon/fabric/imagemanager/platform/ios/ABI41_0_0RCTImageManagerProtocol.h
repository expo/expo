/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI41_0_0React/core/ABI41_0_0ReactPrimitives.h>
#import <ABI41_0_0React/imagemanager/ImageRequest.h>

@protocol ABI41_0_0RCTImageManagerProtocol <NSObject>

- (ABI41_0_0facebook::ABI41_0_0React::ImageRequest)requestImage:(ABI41_0_0facebook::ABI41_0_0React::ImageSource)imageSource
                                    surfaceId:(ABI41_0_0facebook::ABI41_0_0React::SurfaceId)surfaceId;
@end
