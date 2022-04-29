/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <ABI45_0_0RCTSurfaceHostingComponent/ABI45_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI45_0_0RCTSurface;

/**
 * ComponentKit component represents given Surface instance.
 */
@interface ABI45_0_0RCTSurfaceHostingComponent : CKComponent

+ (instancetype)newWithSurface:(ABI45_0_0RCTSurface *)surface options:(ABI45_0_0RCTSurfaceHostingComponentOptions)options;

@end
