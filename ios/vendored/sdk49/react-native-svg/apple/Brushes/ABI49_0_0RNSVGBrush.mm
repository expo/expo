/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGBrush.h"
#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>

@implementation ABI49_0_0RNSVGBrush

- (instancetype)initWithArray:(NSArray *)data
{
  return [super init];
}

- (void)paint:(CGContextRef)context opacity:(CGFloat)opacity painter:(ABI49_0_0RNSVGPainter *)painter bounds:(CGRect)bounds
{
}

- (BOOL)applyFillColor:(CGContextRef)context opacity:(CGFloat)opacity
{
  return NO;
}

- (BOOL)applyStrokeColor:(CGContextRef)context opacity:(CGFloat)opacity
{
  return NO;
}

- (CGColorRef)getColorWithOpacity:(CGFloat)opacity
{
  return nil;
}

- (void)paint:(CGContextRef)context opacity:(CGFloat)opacity painter:(ABI49_0_0RNSVGPainter *)painter
{
  // abstract
}
@end
