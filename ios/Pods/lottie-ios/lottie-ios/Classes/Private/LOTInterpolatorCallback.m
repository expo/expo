//
//  LOTInterpolatorCallback.m
//  Lottie
//
//  Created by brandon_withrow on 1/5/18.
//  Copyright © 2018 Airbnb. All rights reserved.
//

#import "LOTInterpolatorCallback.h"
#import "CGGeometry+LOTAdditions.h"

@implementation LOTFloatInterpolatorCallback

+ (instancetype _Nonnull)withFromFloat:(CGFloat)fromFloat toFloat:(CGFloat)toFloat {
  LOTFloatInterpolatorCallback *interpolator = [[self alloc] init];
  interpolator.fromFloat = fromFloat;
  interpolator.toFloat = toFloat;
  return interpolator;
}
- (CGFloat)floatValueForFrame:(CGFloat)currentFrame startKeyframe:(CGFloat)startKeyframe endKeyframe:(CGFloat)endKeyframe interpolatedProgress:(CGFloat)interpolatedProgress startValue:(CGFloat)startValue endValue:(CGFloat)endValue currentValue:(CGFloat)interpolatedValue {
  return LOT_RemapValue(self.currentProgress, 0, 1, self.fromFloat, self.toFloat);
}

@end

@implementation LOTPointInterpolatorCallback

+ (instancetype _Nonnull)withFromPoint:(CGPoint)fromPoint toPoint:(CGPoint)toPoint {
  LOTPointInterpolatorCallback *interpolator = [[self alloc] init];
  interpolator.fromPoint = fromPoint;
  interpolator.toPoint = toPoint;
  return interpolator;
}
- (CGPoint)pointForFrame:(CGFloat)currentFrame startKeyframe:(CGFloat)startKeyframe endKeyframe:(CGFloat)endKeyframe interpolatedProgress:(CGFloat)interpolatedProgress startPoint:(CGPoint)startPoint endPoint:(CGPoint)endPoint currentPoint:(CGPoint)interpolatedPoint {
  return LOT_PointInLine(self.fromPoint, self.toPoint, self.currentProgress);
}

@end

@implementation LOTSizeInterpolatorCallback

+ (instancetype)withFromSize:(CGSize)fromSize toSize:(CGSize)toSize {
  LOTSizeInterpolatorCallback *interpolator = [[self alloc] init];
  interpolator.fromSize = fromSize;
  interpolator.toSize = toSize;
  return interpolator;
}

- (CGSize)sizeForFrame:(CGFloat)currentFrame startKeyframe:(CGFloat)startKeyframe endKeyframe:(CGFloat)endKeyframe interpolatedProgress:(CGFloat)interpolatedProgress startSize:(CGSize)startSize endSize:(CGSize)endSize currentSize:(CGSize)interpolatedSize {
  CGPoint from = CGPointMake(self.fromSize.width, self.fromSize.height);
  CGPoint to = CGPointMake(self.toSize.width, self.toSize.height);
  CGPoint returnPoint = LOT_PointInLine(from, to, self.currentProgress);
  return CGSizeMake(returnPoint.x, returnPoint.y);
}

@end
