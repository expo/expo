/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0RCTSurfaceHostingComponent/ABI48_0_0RCTSurfaceHostingComponent.h>
#import <ABI48_0_0RCTSurfaceHostingComponent/ABI48_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI48_0_0RCTSurfaceHostingComponentState;

@interface ABI48_0_0RCTSurfaceHostingComponent ()

@property (nonatomic, strong, readonly) id<ABI48_0_0RCTSurfaceProtocol> surface;
@property (nonatomic, retain, readonly) ABI48_0_0RCTSurfaceHostingComponentState *state;
@property (nonatomic, assign, readonly) ABI48_0_0RCTSurfaceHostingComponentOptions options;

@end
