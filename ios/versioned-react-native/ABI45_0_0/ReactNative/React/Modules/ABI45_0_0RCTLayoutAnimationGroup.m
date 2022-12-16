/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTLayoutAnimationGroup.h"

#import "ABI45_0_0RCTConvert.h"
#import "ABI45_0_0RCTLayoutAnimation.h"

@implementation ABI45_0_0RCTLayoutAnimationGroup

- (instancetype)initWithCreatingLayoutAnimation:(ABI45_0_0RCTLayoutAnimation *)creatingLayoutAnimation
                        updatingLayoutAnimation:(ABI45_0_0RCTLayoutAnimation *)updatingLayoutAnimation
                        deletingLayoutAnimation:(ABI45_0_0RCTLayoutAnimation *)deletingLayoutAnimation
                                       callback:(ABI45_0_0RCTResponseSenderBlock)callback
{
  if (self = [super init]) {
    _creatingLayoutAnimation = creatingLayoutAnimation;
    _updatingLayoutAnimation = updatingLayoutAnimation;
    _deletingLayoutAnimation = deletingLayoutAnimation;
    _callback = callback;
  }

  return self;
}

- (instancetype)initWithConfig:(NSDictionary *)config callback:(ABI45_0_0RCTResponseSenderBlock)callback
{
  if (!config) {
    return nil;
  }

  if (self = [super init]) {
    NSTimeInterval duration = [ABI45_0_0RCTConvert NSTimeInterval:config[@"duration"]];

    if (duration > 0.0 && duration < 0.01) {
      ABI45_0_0RCTLogError(@"ABI45_0_0RCTLayoutAnimationGroup expects timings to be in ms, not seconds.");
      duration = duration * 1000.0;
    }

    _creatingLayoutAnimation = [[ABI45_0_0RCTLayoutAnimation alloc] initWithDuration:duration config:config[@"create"]];
    _updatingLayoutAnimation = [[ABI45_0_0RCTLayoutAnimation alloc] initWithDuration:duration config:config[@"update"]];
    _deletingLayoutAnimation = [[ABI45_0_0RCTLayoutAnimation alloc] initWithDuration:duration config:config[@"delete"]];
    _callback = callback;
  }

  return self;
}

- (BOOL)isEqual:(ABI45_0_0RCTLayoutAnimationGroup *)layoutAnimation
{
  ABI45_0_0RCTLayoutAnimation *creatingLayoutAnimation = layoutAnimation.creatingLayoutAnimation;
  ABI45_0_0RCTLayoutAnimation *updatingLayoutAnimation = layoutAnimation.updatingLayoutAnimation;
  ABI45_0_0RCTLayoutAnimation *deletingLayoutAnimation = layoutAnimation.deletingLayoutAnimation;

  return (_creatingLayoutAnimation == creatingLayoutAnimation ||
          [_creatingLayoutAnimation isEqual:creatingLayoutAnimation]) &&
      (_updatingLayoutAnimation == updatingLayoutAnimation ||
       [_updatingLayoutAnimation isEqual:updatingLayoutAnimation]) &&
      (_deletingLayoutAnimation == deletingLayoutAnimation ||
       [_deletingLayoutAnimation isEqual:deletingLayoutAnimation]);
}

- (NSString *)description
{
  return
      [NSString stringWithFormat:
                    @"<%@: %p; creatingLayoutAnimation: %@; updatingLayoutAnimation: %@; deletingLayoutAnimation: %@>",
                    NSStringFromClass([self class]),
                    self,
                    [_creatingLayoutAnimation description],
                    [_updatingLayoutAnimation description],
                    [_deletingLayoutAnimation description]];
}

@end
