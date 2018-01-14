/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTSurfaceHostingComponentState.h"

@implementation ABI25_0_0RCTSurfaceHostingComponentState

+ (instancetype)newWithStage:(ABI25_0_0RCTSurfaceStage)stage
               intrinsicSize:(CGSize)intrinsicSize
{
  return [[self alloc] initWithStage:stage intrinsicSize:intrinsicSize];
}


- (instancetype)initWithStage:(ABI25_0_0RCTSurfaceStage)stage
                intrinsicSize:(CGSize)intrinsicSize
{
  if (self = [super init]) {
    _stage = stage;
    _intrinsicSize = intrinsicSize;
  }

  return self;
}

- (BOOL)isEqual:(ABI25_0_0RCTSurfaceHostingComponentState *)other
{
  if (other == self) {
    return YES;
  }

  return
    _stage == other->_stage &&
    CGSizeEqualToSize(_intrinsicSize, other->_intrinsicSize);
}

@end
