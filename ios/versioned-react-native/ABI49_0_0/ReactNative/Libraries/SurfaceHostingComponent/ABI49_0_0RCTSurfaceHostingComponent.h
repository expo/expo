/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <ABI49_0_0RCTSurfaceHostingComponent/ABI49_0_0RCTSurfaceHostingComponentOptions.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceProtocol.h>

/**
 * ComponentKit component represents given Surface instance.
 */
@interface ABI49_0_0RCTSurfaceHostingComponent : CKComponent

+ (instancetype)newWithSurface:(id<ABI49_0_0RCTSurfaceProtocol>)surface options:(ABI49_0_0RCTSurfaceHostingComponentOptions)options;

@end
