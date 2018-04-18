/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0ARTBrush.h"

#import <ReactABI27_0_0/ABI27_0_0RCTDefines.h>

@implementation ABI27_0_0ARTBrush

- (instancetype)initWithArray:(NSArray *)data
{
  return [super init];
}

ABI27_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (BOOL)applyFillColor:(CGContextRef)context
{
  return NO;
}

- (void)paint:(CGContextRef)context
{
  // abstract
}

@end
