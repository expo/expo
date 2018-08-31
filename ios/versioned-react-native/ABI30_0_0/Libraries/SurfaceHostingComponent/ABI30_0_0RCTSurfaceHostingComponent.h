/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <ABI30_0_0RCTSurfaceHostingComponent/ABI30_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI30_0_0RCTSurface;

/**
 * ComponentKit component represents given Surface instance.
 */
@interface ABI30_0_0RCTSurfaceHostingComponent : CKComponent

+ (instancetype)newWithSurface:(ABI30_0_0RCTSurface *)surface options:(ABI30_0_0RCTSurfaceHostingComponentOptions)options;

@end
