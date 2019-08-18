/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI31_0_0RCTSurfaceHostingComponent/ABI31_0_0RCTSurfaceHostingComponent.h>
#import <ABI31_0_0RCTSurfaceHostingComponent/ABI31_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI31_0_0RCTSurface;
@class ABI31_0_0RCTSurfaceHostingComponentState;

@interface ABI31_0_0RCTSurfaceHostingComponent ()

@property (nonatomic, strong, readonly) ABI31_0_0RCTSurface *surface;
@property (nonatomic, retain, readonly) ABI31_0_0RCTSurfaceHostingComponentState *state;
@property (nonatomic, assign, readonly) ABI31_0_0RCTSurfaceHostingComponentOptions options;

@end
