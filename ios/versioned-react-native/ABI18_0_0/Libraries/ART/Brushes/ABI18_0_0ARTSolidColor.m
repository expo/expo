/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0ARTSolidColor.h"

#import <ReactABI18_0_0/ABI18_0_0RCTLog.h>

#import "ABI18_0_0RCTConvert+ART.h"

@implementation ABI18_0_0ARTSolidColor
{
  CGColorRef _color;
}

- (instancetype)initWithArray:(NSArray<NSNumber *> *)array
{
  if ((self = [super initWithArray:array])) {
    _color = CGColorRetain([ABI18_0_0RCTConvert CGColor:array offset:1]);
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
