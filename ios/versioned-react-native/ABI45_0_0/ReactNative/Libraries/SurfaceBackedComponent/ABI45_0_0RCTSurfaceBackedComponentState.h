/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class ABI45_0_0RCTSurface;

@interface ABI45_0_0RCTSurfaceBackedComponentState: NSObject

@property (atomic, readonly, strong) ABI45_0_0RCTSurface *surface;

+ (instancetype)newWithSurface:(ABI45_0_0RCTSurface *)surface;

@end
