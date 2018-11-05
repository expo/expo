/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class ABI28_0_0RCTSurface;

@interface ABI28_0_0RCTSurfaceBackedComponentState: NSObject

@property (atomic, readonly, strong) ABI28_0_0RCTSurface *surface;

+ (instancetype)newWithSurface:(ABI28_0_0RCTSurface *)surface;

@end
