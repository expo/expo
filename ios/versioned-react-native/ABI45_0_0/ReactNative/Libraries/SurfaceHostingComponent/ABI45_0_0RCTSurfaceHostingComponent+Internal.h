/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0RCTSurfaceHostingComponent/ABI45_0_0RCTSurfaceHostingComponent.h>
#import <ABI45_0_0RCTSurfaceHostingComponent/ABI45_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI45_0_0RCTSurface;
@class ABI45_0_0RCTSurfaceHostingComponentState;

@interface ABI45_0_0RCTSurfaceHostingComponent ()

@property (nonatomic, strong, readonly) ABI45_0_0RCTSurface *surface;
@property (nonatomic, retain, readonly) ABI45_0_0RCTSurfaceHostingComponentState *state;
@property (nonatomic, assign, readonly) ABI45_0_0RCTSurfaceHostingComponentOptions options;

@end
