/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTSurfaceBackedComponentState.h"

#import <ReactABI25_0_0/ABI25_0_0RCTSurface.h>

@implementation ABI25_0_0RCTSurfaceBackedComponentState

+ (instancetype)newWithSurface:(ABI25_0_0RCTSurface *)surface
{
  return [[self alloc] initWithSurface:surface];
}

- (instancetype)initWithSurface:(ABI25_0_0RCTSurface *)surface
{
  if (self == [super init]) {
    _surface = surface;
  }

  return self;
}

@end
