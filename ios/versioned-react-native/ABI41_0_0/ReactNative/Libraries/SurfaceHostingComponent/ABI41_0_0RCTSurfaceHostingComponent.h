/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <ABI41_0_0RCTSurfaceHostingComponent/ABI41_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI41_0_0RCTSurface;

/**
 * ComponentKit component represents given Surface instance.
 */
@interface ABI41_0_0RCTSurfaceHostingComponent : CKComponent

+ (instancetype)newWithSurface:(ABI41_0_0RCTSurface *)surface options:(ABI41_0_0RCTSurfaceHostingComponentOptions)options;

@end
