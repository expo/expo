/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <ABI48_0_0RCTSurfaceHostingComponent/ABI48_0_0RCTSurfaceHostingComponentOptions.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfaceProtocol.h>

/**
 * ComponentKit component represents given Surface instance.
 */
@interface ABI48_0_0RCTSurfaceHostingComponent : CKComponent

+ (instancetype)newWithSurface:(id<ABI48_0_0RCTSurfaceProtocol>)surface options:(ABI48_0_0RCTSurfaceHostingComponentOptions)options;

@end
