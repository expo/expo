/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0ARTSolidColor.h"

#import <ReactABI28_0_0/ABI28_0_0RCTLog.h>

#import "ABI28_0_0RCTConvert+ART.h"

@implementation ABI28_0_0ARTSolidColor
{
  CGColorRef _color;
}

- (instancetype)initWithArray:(NSArray<NSNumber *> *)array
{
  if ((self = [super initWithArray:array])) {
    _color = CGColorRetain([ABI28_0_0RCTConvert CGColor:array offset:1]);
  }
  return self;
}

- (void)dealloc
{
  CGColorRelease(_color);
}

- (BOOL)applyFillColor:(CGContextRef)context
{
  CGContextSetFillColorWithColor(context, _color);
  return YES;
}

@end
