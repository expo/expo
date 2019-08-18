//
//  LOTPointInterpolator.m
//  Lottie
//
//  Created by brandon_withrow on 7/12/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTPointInterpolator.h"
#import "CGGeometry+LOTAdditions.h"

@implementation LOTPointInterpolator

- (CGPoint)pointValueForFrame:(NSNumber *)frame {
  CGFloat progress = [self progressForFrame:frame];
  CGPoint returnPoint;
  if (progress == 0) {
    returnPoint = self.leadingKeyframe.pointValue;
  } else if (progress == 1) {
    returnPoint = self.trailingKeyframe.pointValue;
  } else if (!CGPointEqualToPoint(self.leadingKeyframe.spatialOutTangent, CGPointZero) ||
             !CGPointEqualToPoint(self.trailingKeyframe.spatialInTangent, CGPointZero)) {
    // Spatial Bezier path
    CGPoint outTan = LOT_PointAddedToPoint(self.leadingKeyframe.pointValue, self.leadingKeyframe.spatialOutTangent);
    CGPoint inTan = LOT_PointAddedToPoint(self.trailingKeyframe.pointValue, self.trailingKeyframe.spatialInTangent);
    returnPoint = LOT_PointInCubicCurve(self.leadingKeyframe.pointValue, outTan, inTan, self.trailingKeyframe.pointValue, progress);
  } else {
    returnPoint = LOT_PointInLine(self.leadingKeyframe.pointValue, self.trailingKeyframe.pointValue, progress);
  }
  if (self.hasDelegateOverride) {
    return [self.delegate pointForFrame:frame.floatValue
                          startKeyframe:self.leadingKeyframe.keyframeTime.floatValue
                            endKeyframe:self.trailingKeyframe.keyframeTime.floatValue
                   interpolatedProgress:progress
                             startPoint:self.leadingKeyframe.pointValue
                               endPoint:self.trailingKeyframe.pointValue
                           currentPoint:returnPoint];
  }
  return returnPoint;
}

- (BOOL)hasDelegateOverride {
  return self.delegate != nil;
}

- (void)setValueDelegate:(id<LOTValueDelegate>)delegate {
  NSAssert(([delegate conformsToProtocol:@protocol(LOTPointValueDelegate)]), @"Point Interpolator set with incorrect callback type. Expected LOTPointValueDelegate");
  self.delegate = (id<LOTPointValueDelegate>)delegate;
}

@end
