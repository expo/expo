/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@protocol ABI40_0_0RCTDisplayRefreshable

- (void)displayDidRefresh:(CADisplayLink *)displayLink;

@end

@interface ABI40_0_0RCTDisplayWeakRefreshable : NSObject

@property (nonatomic, weak) id<ABI40_0_0RCTDisplayRefreshable> refreshable;

+ (CADisplayLink *)displayLinkWithWeakRefreshable:(id<ABI40_0_0RCTDisplayRefreshable>)refreshable;

@end
