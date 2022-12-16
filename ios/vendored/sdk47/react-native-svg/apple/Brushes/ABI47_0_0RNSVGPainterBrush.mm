/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGPainterBrush.h"
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>
#import "ABI47_0_0RCTConvert+RNSVG.h"
#import "ABI47_0_0RNSVGPainter.h"

@implementation ABI47_0_0RNSVGPainterBrush

- (instancetype)initWithArray:(NSArray *)array
{
  if ((self = [super initWithArray:array])) {
    if (array.count != 2) {
      ABI47_0_0RCTLogError(@"-[%@ %@] expects 2 elements, received %@", self.class, NSStringFromSelector(_cmd), array);
      return nil;
    }

    self.brushRef = [array objectAtIndex:1];
  }
  return self;
}

- (void)paint:(CGContextRef)context opacity:(CGFloat)opacity painter:(ABI47_0_0RNSVGPainter *)painter bounds:(CGRect)bounds
{
  BOOL transparency = opacity < 1;
  if (transparency) {
    CGContextSetAlpha(context, opacity);
    CGContextBeginTransparencyLayer(context, NULL);
  }

  [painter paint:context bounds:bounds];

  if (transparency) {
    CGContextEndTransparencyLayer(context);
  }
}

@end
