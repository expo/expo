/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTSurfaceHostingComponentState.h"

@implementation ABI28_0_0RCTSurfaceHostingComponentState

+ (instancetype)newWithStage:(ABI28_0_0RCTSurfaceStage)stage
               intrinsicSize:(CGSize)intrinsicSize
{
  return [[self alloc] initWithStage:stage intrinsicSize:intrinsicSize];
}


- (instancetype)initWithStage:(ABI28_0_0RCTSurfaceStage)stage
                intrinsicSize:(CGSize)intrinsicSize
{
  if (self = [super init]) {
    _stage = stage;
    _intrinsicSize = intrinsicSize;
  }

  return self;
}

- (BOOL)isEqual:(ABI28_0_0RCTSurfaceHostingComponentState *)other
{
  if (other == self) {
    return YES;
  }

  return
    _stage == other->_stage &&
    CGSizeEqualToSize(_intrinsicSize, other->_intrinsicSize);
}

@end
