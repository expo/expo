//
//  LOTPolystarAnimator.m
//  Lottie
//
//  Created by brandon_withrow on 7/27/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTPolystarAnimator.h"
#import "LOTPointInterpolator.h"
#import "LOTNumberInterpolator.h"
#import "LOTBezierPath.h"
#import "CGGeometry+LOTAdditions.h"

const CGFloat kPOLYSTAR_MAGIC_NUMBER = .47829f;

@implementation LOTPolystarAnimator {
  LOTNumberInterpolator *_outerRadiusInterpolator;
  LOTNumberInterpolator *_innerRadiusInterpolator;
  LOTNumberInterpolator *_outerRoundnessInterpolator;
  LOTNumberInterpolator *_innerRoundnessInterpolator;
  LOTPointInterpolator *_positionInterpolator;
  LOTNumberInterpolator *_pointsInterpolator;
  LOTNumberInterpolator *_rotationInterpolator;
}

- (instancetype _Nonnull)initWithInputNode:(LOTAnimatorNode *_Nullable)inputNode
                             shapeStar:(LOTShapeStar *_Nonnull)shapeStar {
  self = [super initWithInputNode:inputNode keyName:shapeStar.keyname];
  if (self) {
    _outerRadiusInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:shapeStar.outerRadius.keyframes];
    _innerRadiusInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:shapeStar.innerRadius.keyframes];
    _outerRoundnessInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:shapeStar.outerRoundness.keyframes];
    _innerRoundnessInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:shapeStar.innerRoundness.keyframes];
    _pointsInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:shapeStar.numberOfPoints.keyframes];
    _rotationInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:shapeStar.rotation.keyframes];
    _positionInterpolator = [[LOTPointInterpolator alloc] initWithKeyframes:shapeStar.position.keyframes];
  }
  return self;
}

- (NSDictionary *)valueInterpolators {
  return @{@"Points" : _pointsInterpolator,
           @"Position" : _positionInterpolator,
           @"Rotation" : _rotationInterpolator,
           @"Inner Radius" : _innerRadiusInterpolator,
           @"Outer Radius" : _outerRadiusInterpolator,
           @"Inner Roundness" : _innerRoundnessInterpolator,
           @"Outer Roundness" : _outerRoundnessInterpolator};
}

- (BOOL)needsUpdateForFrame:(NSNumber *)frame {
  return ([_outerRadiusInterpolator hasUpdateForFrame:frame] ||
          [_innerRadiusInterpolator hasUpdateForFrame:frame] ||
          [_outerRoundnessInterpolator hasUpdateForFrame:frame] ||
          [_innerRoundnessInterpolator hasUpdateForFrame:frame] ||
          [_pointsInterpolator hasUpdateForFrame:frame] ||
          [_rotationInterpolator hasUpdateForFrame:frame] ||
          [_positionInterpolator hasUpdateForFrame:frame]);
}

- (void)performLocalUpdate {
  CGFloat outerRadius = [_outerRadiusInterpolator floatValueForFrame:self.currentFrame];
  CGFloat innerRadius = [_innerRadiusInterpolator floatValueForFrame:self.currentFrame];
  CGFloat outerRoundness = [_outerRoundnessInterpolator floatValueForFrame:self.currentFrame] / 100.f;
  CGFloat innerRoundness = [_innerRoundnessInterpolator floatValueForFrame:self.currentFrame] / 100.f;
  CGFloat points = [_pointsInterpolator floatValueForFrame:self.currentFrame];
  CGFloat rotation = [_rotationInterpolator floatValueForFrame:self.currentFrame];
  CGPoint position = [_positionInterpolator pointValueForFrame:self.currentFrame];
  LOTBezierPath *path = [[LOTBezierPath alloc] init];
  path.cacheLengths = self.pathShouldCacheLengths;
  CGFloat currentAngle = LOT_DegreesToRadians(rotation - 90);
  CGFloat anglePerPoint = (CGFloat)((2 * M_PI) / points);
  CGFloat halfAnglePerPoint = anglePerPoint / 2.0f;
  CGFloat partialPointAmount = points - floor(points);
  if (partialPointAmount != 0) {
    currentAngle += halfAnglePerPoint * (1.f - partialPointAmount);
  }

  CGFloat x;
  CGFloat y;
  CGFloat previousX;
  CGFloat previousY;
  CGFloat partialPointRadius = 0;
  if (partialPointAmount != 0) {
    partialPointRadius = innerRadius + partialPointAmount * (outerRadius - innerRadius);
    x = (CGFloat) (partialPointRadius * cosf(currentAngle));
    y = (CGFloat) (partialPointRadius * sinf(currentAngle));
    [path LOT_moveToPoint:CGPointMake(x, y)];
    currentAngle += anglePerPoint * partialPointAmount / 2.f;
  } else {
    x = (float) (outerRadius * cosf(currentAngle));
    y = (float) (outerRadius * sinf(currentAngle));
    [path LOT_moveToPoint:CGPointMake(x, y)];
    currentAngle += halfAnglePerPoint;
  }

  // True means the line will go to outer radius. False means inner radius.
  BOOL longSegment = false;
  CGFloat numPoints = ceil(points) * 2;
  for (int i = 0; i < numPoints; i++) {
    CGFloat radius = longSegment ? outerRadius : innerRadius;
    CGFloat dTheta = halfAnglePerPoint;
    if (partialPointRadius != 0 && i == numPoints - 2) {
      dTheta = anglePerPoint * partialPointAmount / 2.f;
    }
    if (partialPointRadius != 0 && i == numPoints - 1) {
      radius = partialPointRadius;
    }
    previousX = x;
    previousY = y;
    x = (CGFloat) (radius * cosf(currentAngle));
    y = (CGFloat) (radius * sinf(currentAngle));

    if (innerRoundness == 0 && outerRoundness == 0) {
      [path LOT_addLineToPoint:CGPointMake(x, y)];
    } else {
      CGFloat cp1Theta = (CGFloat) (atan2f(previousY, previousX) - M_PI / 2.f);
      CGFloat cp1Dx = (CGFloat) cosf(cp1Theta);
      CGFloat cp1Dy = (CGFloat) sinf(cp1Theta);
      
      CGFloat cp2Theta = (CGFloat) (atan2f(y, x) - M_PI / 2.f);
      CGFloat cp2Dx = (CGFloat) cosf(cp2Theta);
      CGFloat cp2Dy = (CGFloat) sinf(cp2Theta);
      
      CGFloat cp1Roundedness = longSegment ? innerRoundness : outerRoundness;
      CGFloat cp2Roundedness = longSegment ? outerRoundness : innerRoundness;
      CGFloat cp1Radius = longSegment ? innerRadius : outerRadius;
      CGFloat cp2Radius = longSegment ? outerRadius : innerRadius;
      
      CGFloat cp1x = cp1Radius * cp1Roundedness * kPOLYSTAR_MAGIC_NUMBER * cp1Dx;
      CGFloat cp1y = cp1Radius * cp1Roundedness * kPOLYSTAR_MAGIC_NUMBER * cp1Dy;
      CGFloat cp2x = cp2Radius * cp2Roundedness * kPOLYSTAR_MAGIC_NUMBER * cp2Dx;
      CGFloat cp2y = cp2Radius * cp2Roundedness * kPOLYSTAR_MAGIC_NUMBER * cp2Dy;
      if (partialPointAmount != 0) {
        if (i == 0) {
          cp1x *= partialPointAmount;
          cp1y *= partialPointAmount;
        } else if (i == numPoints - 1) {
          cp2x *= partialPointAmount;
          cp2y *= partialPointAmount;
        }
      }
      [path LOT_addCurveToPoint:CGPointMake(x, y)
                  controlPoint1:CGPointMake(previousX - cp1x, previousY - cp1y)
                  controlPoint2:CGPointMake(x + cp2x, y + cp2y)];
    }
    currentAngle += dTheta;
    longSegment = !longSegment;
  }
  [path LOT_closePath];
  [path LOT_applyTransform:CGAffineTransformMakeTranslation(position.x, position.y)];
  self.localPath = path;
}

@end
