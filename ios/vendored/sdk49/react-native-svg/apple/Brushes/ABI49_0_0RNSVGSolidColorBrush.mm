/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGSolidColorBrush.h"
#import "ABI49_0_0RNSVGUIKit.h"

#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import "ABI49_0_0RCTConvert+RNSVG.h"

@implementation ABI49_0_0RNSVGSolidColorBrush {
  ABI49_0_0RNSVGColor *_color;
}

- (instancetype)initWithArray:(NSArray<ABI49_0_0RNSVGLength *> *)array
{
  if ((self = [super initWithArray:array])) {
    _color = [ABI49_0_0RCTConvert ABI49_0_0RNSVGColor:array offset:1];
  }
  return self;
}

- (instancetype)initWithNumber:(NSNumber *)number
{
  if ((self = [super init])) {
    _color = [ABI49_0_0RCTConvert ABI49_0_0RNSVGColor:number];
  }
  return self;
}

- (instancetype)initWithColor:(ABI49_0_0RNSVGColor *)color
{
  if ((self = [super init])) {
    _color = color;
  }
  return self;
}

- (void)dealloc
{
  _color = nil;
}

- (CGColorRef)getColorWithOpacity:(CGFloat)opacity
{
  CGColorRef baseColor = _color.CGColor;
  CGColorRef color = CGColorCreateCopyWithAlpha(baseColor, opacity * CGColorGetAlpha(baseColor));
  return color;
}

- (BOOL)applyFillColor:(CGContextRef)context opacity:(CGFloat)opacity
{
  CGColorRef color = [self getColorWithOpacity:opacity];
  CGContextSetFillColorWithColor(context, color);
  CGColorRelease(color);
  return YES;
}

- (BOOL)applyStrokeColor:(CGContextRef)context opacity:(CGFloat)opacity
{
  CGColorRef color = [self getColorWithOpacity:opacity];
  CGContextSetStrokeColorWithColor(context, color);
  CGColorRelease(color);
  return YES;
}

@end
