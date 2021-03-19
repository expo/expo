/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTSurfaceBackedComponentState.h"

#import <ABI41_0_0React/ABI41_0_0RCTSurface.h>

@implementation ABI41_0_0RCTSurfaceBackedComponentState

+ (instancetype)newWithSurface:(ABI41_0_0RCTSurface *)surface
{
  return [[self alloc] initWithSurface:surface];
}

- (instancetype)initWithSurface:(ABI41_0_0RCTSurface *)surface
{
  if (self = [super init]) {
    _surface = surface;
  }

  return self;
}

@end
