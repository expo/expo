/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class ABI27_0_0RCTSurface;

@interface ABI27_0_0RCTSurfaceBackedComponentState: NSObject

@property (atomic, readonly, strong) ABI27_0_0RCTSurface *surface;

+ (instancetype)newWithSurface:(ABI27_0_0RCTSurface *)surface;

@end
