/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0ARTBrush.h>

#import <ABI39_0_0React/ABI39_0_0RCTDefines.h>

@implementation ABI39_0_0ARTBrush

- (instancetype)initWithArray:(NSArray *)data
{
  return [super init];
}

ABI39_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (BOOL)applyFillColor:(CGContextRef)context
{
  return NO;
}

- (void)paint:(CGContextRef)context
{
  // abstract
}

@end
