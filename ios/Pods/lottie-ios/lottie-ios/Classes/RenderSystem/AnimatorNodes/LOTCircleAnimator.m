//
//  LOTCircleAnimator.m
//  Lottie
//
//  Created by brandon_withrow on 7/19/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTCircleAnimator.h"
#import "LOTPointInterpolator.h"

const CGFloat kLOTEllipseControlPointPercentage = 0.55228;

@implementation LOTCircleAnimator {
  LOTPointInterpolator *_centerInterpolator;
  LOTPointInterpolator *_sizeInterpolator;
  BOOL _reversed;
}

- (instancetype _Nonnull)initWithInputNode:(LOTAnimatorNode *_Nullable)inputNode
                                  shapeCircle:(LOTShapeCircle *_Nonnull)shapeCircle {
  self = [super initWithInputNode:inputNode keyName:shapeCircle.keyname];
  if (self) {
    _centerInterpolator = [[LOTPointInterpolator alloc] initWithKeyframes:shapeCircle.position.keyframes];
    _sizeInterpolator = [[LOTPointInterpolator alloc] initWithKeyframes:shapeCircle.size.keyframes];
    _reversed = shapeCircle.reversed;
  }
  return self;
}

- (NSDictionary *)valueInterpolators {
  return @{@"Size" : _sizeInterpolator,
           @"Position" : _centerInterpolator};
}

- (BOOL)needsUpdateForFrame:(NSNumber *)frame {
  return [_centerInterpolator hasUpdateForFrame:frame] || [_sizeInterpolator hasUpdateForFrame:frame];
}

- (void)performLocalUpdate {
  // Unfortunately we HAVE to manually build out the ellipse.
  // Every Apple method constructs from the 3 o-clock position
  // After effects constructs from the Noon position.
  // After effects does clockwise, but also has a flag for reversed.
  CGPoint center = [_centerInterpolator pointValueForFrame:self.currentFrame];
  CGPoint size = [_sizeInterpolator pointValueForFrame:self.currentFrame];
  
  CGFloat halfWidth = size.x / 2;
  CGFloat halfHeight = size.y / 2;
  
  if (_reversed) {
    halfWidth = halfWidth * -1;
  }
  
  CGPoint circleQ1 = CGPointMake(center.x, center.y - halfHeight);
  CGPoint circleQ2 = CGPointMake(center.x + halfWidth, center.y);
  CGPoint circleQ3 = CGPointMake(center.x, center.y + halfHeight);
  CGPoint circleQ4 = CGPointMake(center.x - halfWidth, center.y);
  
  CGFloat cpW = halfWidth * kLOTEllipseControlPointPercentage;
  CGFloat cpH = halfHeight * kLOTEllipseControlPointPercentage;
  
  LOTBezierPath *path = [[LOTBezierPath alloc] init];
  path.cacheLengths = self.pathShouldCacheLengths;
  [path LOT_moveToPoint:circleQ1];
  [path LOT_addCurveToPoint:circleQ2 controlPoint1:CGPointMake(circleQ1.x + cpW, circleQ1.y) controlPoint2:CGPointMake(circleQ2.x, circleQ2.y - cpH)];
  
  [path LOT_addCurveToPoint:circleQ3 controlPoint1:CGPointMake(circleQ2.x, circleQ2.y + cpH) controlPoint2:CGPointMake(circleQ3.x + cpW, circleQ3.y)];
  
  [path LOT_addCurveToPoint:circleQ4 controlPoint1:CGPointMake(circleQ3.x - cpW, circleQ3.y) controlPoint2:CGPointMake(circleQ4.x, circleQ4.y + cpH)];
  
  [path LOT_addCurveToPoint:circleQ1 controlPoint1:CGPointMake(circleQ4.x, circleQ4.y - cpH) controlPoint2:CGPointMake(circleQ1.x - cpW, circleQ1.y)];

  self.localPath = path;
}

@end
