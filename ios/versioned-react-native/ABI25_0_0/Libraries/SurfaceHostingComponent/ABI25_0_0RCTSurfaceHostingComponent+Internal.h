/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ABI25_0_0RCTSurfaceHostingComponent/ABI25_0_0RCTSurfaceHostingComponent.h>
#import <ABI25_0_0RCTSurfaceHostingComponent/ABI25_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI25_0_0RCTSurface;
@class ABI25_0_0RCTSurfaceHostingComponentState;

@interface ABI25_0_0RCTSurfaceHostingComponent ()

@property (nonatomic, strong, readonly) ABI25_0_0RCTSurface *surface;
@property (nonatomic, retain, readonly) ABI25_0_0RCTSurfaceHostingComponentState *state;
@property (nonatomic, assign, readonly) ABI25_0_0RCTSurfaceHostingComponentOptions options;

@end
