/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0ARTRadialGradient.h"

#import "ABI8_0_0RCTConvert+ART.h"
#import "ABI8_0_0RCTLog.h"

@implementation ABI8_0_0ARTRadialGradient
{
  CGGradientRef _gradient;
  CGPoint _focusPoint;
  CGPoint _centerPoint;
  CGFloat _radius;
  CGFloat _radiusRatio;
}

- (instancetype)initWithArray:(NSArray<NSNumber *> *)array
{
  if ((self = [super initWithArray:array])) {
    if (array.count < 7) {
      ABI8_0_0RCTLogError(@"-[%@ %@] expects 7 elements, received %@",
                  self.class, NSStringFromSelector(_cmd), array);
      return nil;
    }
    _radius = [ABI8_0_0RCTConvert CGFloat:array[3]];
    _radiusRatio = [ABI8_0_0RCTConvert CGFloat:array[4]] / _radius;
    _focusPoint.x = [ABI8_0_0RCTConvert CGFloat:array[1]];
    _focusPoint.y = [ABI8_0_0RCTConvert CGFloat:array[2]] / _radiusRatio;
    _centerPoint.x = [ABI8_0_0RCTConvert CGFloat:array[5]];
    _centerPoint.y = [ABI8_0_0RCTConvert CGFloat:array[6]] / _radiusRatio;
    _gradient = CGGradientRetain([ABI8_0_0RCTConvert CGGradient:array offset:7]);
  }
  return self;
}

- (void)dealloc
{
  CGGradientRelease(_gradient);
}

- (void)paint:(CGContextRef)context
{
  CGAffineTransform transform = CGAffineTransformMakeScale(1, _radiusRatio);
  CGContextConcatCTM(context, transform);
  CGGradientDrawingOptions extendOptions = kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation;
  CGContextDrawRadialGradient(context, _gradient, _focusPoint, 0, _centerPoint, _radius, extendOptions);
}

@end
