/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI35_0_0RCTSurfaceHostingComponent/ABI35_0_0RCTSurfaceHostingComponent.h>
#import <ABI35_0_0RCTSurfaceHostingComponent/ABI35_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI35_0_0RCTSurface;
@class ABI35_0_0RCTSurfaceHostingComponentState;

@interface ABI35_0_0RCTSurfaceHostingComponent ()

@property (nonatomic, strong, readonly) ABI35_0_0RCTSurface *surface;
@property (nonatomic, retain, readonly) ABI35_0_0RCTSurfaceHostingComponentState *state;
@property (nonatomic, assign, readonly) ABI35_0_0RCTSurfaceHostingComponentOptions options;

@end
