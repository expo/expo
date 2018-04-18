/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI27_0_0RCTSurfaceHostingComponent/ABI27_0_0RCTSurfaceHostingComponent.h>
#import <ABI27_0_0RCTSurfaceHostingComponent/ABI27_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI27_0_0RCTSurface;
@class ABI27_0_0RCTSurfaceHostingComponentState;

@interface ABI27_0_0RCTSurfaceHostingComponent ()

@property (nonatomic, strong, readonly) ABI27_0_0RCTSurface *surface;
@property (nonatomic, retain, readonly) ABI27_0_0RCTSurfaceHostingComponentState *state;
@property (nonatomic, assign, readonly) ABI27_0_0RCTSurfaceHostingComponentOptions options;

@end
