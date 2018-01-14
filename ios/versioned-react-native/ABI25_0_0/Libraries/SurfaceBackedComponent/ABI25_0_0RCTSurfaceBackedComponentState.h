/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

@class ABI25_0_0RCTSurface;

@interface ABI25_0_0RCTSurfaceBackedComponentState: NSObject

@property (atomic, readonly, strong) ABI25_0_0RCTSurface *surface;

+ (instancetype)newWithSurface:(ABI25_0_0RCTSurface *)surface;

@end
