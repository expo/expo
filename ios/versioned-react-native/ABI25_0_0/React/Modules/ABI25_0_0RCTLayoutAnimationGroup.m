/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTLayoutAnimationGroup.h"

#import "ABI25_0_0RCTLayoutAnimation.h"
#import "ABI25_0_0RCTConvert.h"

@implementation ABI25_0_0RCTLayoutAnimationGroup

- (instancetype)initWithCreatingLayoutAnimation:(ABI25_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI25_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI25_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI25_0_0RCTResponseSenderBlock)callback
{
  if (self = [super init]) {
    _creatingLayoutAnimation = creatingLayoutAnimation;
    _updatingLayoutAnimation = updatingLayoutAnimation;
    _deletingLayoutAnimation = deletingLayoutAnimation;
    _callback = callback;
  }

  return self;
}

- (instancetype)initWithConfig:(NSDictionary *)config
                      callback:(ABI25_0_0RCTResponseSenderBlock)callback
{
  if (!config) {
    return nil;
  }

  if (self = [super init]) {
    NSTimeInterval duration = [ABI25_0_0RCTConvert NSTimeInterval:config[@"duration"]];

    if (duration > 0.0 && duration < 0.01) {
      ABI25_0_0RCTLogError(@"ABI25_0_0RCTLayoutAnimationGroup expects timings to be in ms, not seconds.");
      duration = duration * 1000.0;
    }

    _creatingLayoutAnimation = [[ABI25_0_0RCTLayoutAnimation alloc] initWithDuration:duration config:config[@"create"]];
    _updatingLayoutAnimation = [[ABI25_0_0RCTLayoutAnimation alloc] initWithDuration:duration config:config[@"update"]];
    _deletingLayoutAnimation = [[ABI25_0_0RCTLayoutAnimation alloc] initWithDuration:duration config:config[@"delete"]];
    _callback = callback;
  }

  return self;
}

- (BOOL)isEqual:(ABI25_0_0RCTLayoutAnimationGroup *)layoutAnimation
{
  ABI25_0_0RCTLayoutAnimation *creatingLayoutAnimation = layoutAnimation.creatingLayoutAnimation;
  ABI25_0_0RCTLayoutAnimation *updatingLayoutAnimation = layoutAnimation.updatingLayoutAnimation;
  ABI25_0_0RCTLayoutAnimation *deletingLayoutAnimation = layoutAnimation.deletingLayoutAnimation;

  return
    (_creatingLayoutAnimation == creatingLayoutAnimation || [_creatingLayoutAnimation isEqual:creatingLayoutAnimation]) &&
    (_updatingLayoutAnimation == updatingLayoutAnimation || [_updatingLayoutAnimation isEqual:updatingLayoutAnimation]) &&
    (_deletingLayoutAnimation == deletingLayoutAnimation || [_deletingLayoutAnimation isEqual:deletingLayoutAnimation]);
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; creatingLayoutAnimation: %@; updatingLayoutAnimation: %@; deletingLayoutAnimation: %@>",
          NSStringFromClass([self class]), self, [_creatingLayoutAnimation description], [_updatingLayoutAnimation description], [_deletingLayoutAnimation description]];
}

@end
