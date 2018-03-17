/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ComponentKit/CKComponent.h>
#import <ABI26_0_0RCTSurfaceHostingComponent/ABI26_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI26_0_0RCTSurface;

/**
 * ComponentKit component represents given Surface instance.
 */
@interface ABI26_0_0RCTSurfaceHostingComponent : CKComponent

+ (instancetype)newWithSurface:(ABI26_0_0RCTSurface *)surface options:(ABI26_0_0RCTSurfaceHostingComponentOptions)options;

@end
