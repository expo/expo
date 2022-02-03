/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTDisplayWeakRefreshable.h"

@implementation ABI44_0_0RCTDisplayWeakRefreshable

+ (CADisplayLink *)displayLinkWithWeakRefreshable:(id<ABI44_0_0RCTDisplayRefreshable>)refreshable {
  ABI44_0_0RCTDisplayWeakRefreshable *target = [[ABI44_0_0RCTDisplayWeakRefreshable alloc] initWithRefreshable:refreshable];
  return [CADisplayLink displayLinkWithTarget:target selector:@selector(displayDidRefresh:)];
}

- (instancetype)initWithRefreshable:(id<ABI44_0_0RCTDisplayRefreshable>)refreshable
{
  if (self = [super init]) {
    _refreshable = refreshable;
  }
  return self;
}

- (void)displayDidRefresh:(CADisplayLink *)displayLink {
  [_refreshable displayDidRefresh:displayLink];
}

@end
