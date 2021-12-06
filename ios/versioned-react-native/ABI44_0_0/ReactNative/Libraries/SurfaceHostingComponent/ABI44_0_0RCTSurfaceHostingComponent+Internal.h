/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0RCTSurfaceHostingComponent/ABI44_0_0RCTSurfaceHostingComponent.h>
#import <ABI44_0_0RCTSurfaceHostingComponent/ABI44_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI44_0_0RCTSurface;
@class ABI44_0_0RCTSurfaceHostingComponentState;

@interface ABI44_0_0RCTSurfaceHostingComponent ()

@property (nonatomic, strong, readonly) ABI44_0_0RCTSurface *surface;
@property (nonatomic, retain, readonly) ABI44_0_0RCTSurfaceHostingComponentState *state;
@property (nonatomic, assign, readonly) ABI44_0_0RCTSurfaceHostingComponentOptions options;

@end
