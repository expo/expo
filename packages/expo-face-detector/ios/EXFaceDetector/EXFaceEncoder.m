//
//  EXFaceEncoder.m
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXFaceDetector/EXFaceEncoder.h>

#define cDefaultFloatComparisonEpsilon 0.0001
#define cModEqualFloatsWithEpsilon(dividend, divisor, modulo, epsilon) \
        fabs( fmod(dividend, divisor) - modulo ) < epsilon
#define cModEqualFloats(dividend, divisor, modulo) \
        cModEqualFloatsWithEpsilon(dividend, divisor, modulo, cDefaultFloatComparisonEpsilon)

@interface EXFaceEncoder()

@property (assign, nonatomic) BOOL swapWidthAndHeight;
@property (assign, nonatomic) CGAffineTransform transform;
@property (assign, nonatomic) CGFloat rollAngleDegreesFromTransform;

@end

@implementation EXFaceEncoder

- (instancetype)init
{
  return [self initWithTransform:CGAffineTransformIdentity];
}

- (instancetype)initWithTransform:(CGAffineTransform)transform
{
  self = [super init];
  if (self) {
    _transform = transform;
    _rollAngleDegreesFromTransform = [self radianAngleToDegrees:[self rollAngleFromTransform:_transform]];
    _swapWidthAndHeight = cModEqualFloats(_rollAngleDegreesFromTransform + 360, 180, 90);
  }
  return self;
}


- (NSDictionary *)encode:(GMVFaceFeature *)face
{
  CGRect bounds = CGRectApplyAffineTransform(face.bounds, _transform);
  NSDictionary *initialDictionary = @{
                                      @"bounds" : @{
                                          @"size" : @{
                                              @"width" : @(_swapWidthAndHeight ? bounds.size.height : bounds.size.width),
                                              @"height" : @(_swapWidthAndHeight ? bounds.size.width : bounds.size.height)
                                              },
                                          @"origin" : @{
                                              @"x" : @(bounds.origin.x),
                                              @"y" : @(bounds.origin.y)
                                              }
                                          }
                                      };
  NSMutableDictionary *encodedFace = [[NSMutableDictionary alloc] initWithDictionary:initialDictionary];
  [self putAFloat:face.smilingProbability forKey:@"smilingProbability" toDictionary:encodedFace ifValueIsValid:face.hasSmilingProbability];
  [self putAnInteger:face.trackingID forKey:@"faceID" toDictionary:encodedFace ifValueIsValid:face.hasTrackingID];
  
  [self putAPoint:face.leftEarPosition forKey:@"leftEarPosition" toDictionary:encodedFace ifValueIsValid:face.hasLeftEarPosition];
  [self putAPoint:face.rightEarPosition forKey:@"rightEarPosition" toDictionary:encodedFace ifValueIsValid:face.hasRightEarPosition];
  
  [self putAPoint:face.leftEyePosition forKey:@"leftEyePosition" toDictionary:encodedFace ifValueIsValid:face.hasLeftEyePosition];
  [self putAFloat:face.leftEyeOpenProbability forKey:@"leftEyeOpenProbability" toDictionary:encodedFace ifValueIsValid:face.hasLeftEyeOpenProbability];
  
  [self putAPoint:face.rightEyePosition forKey:@"rightEyePosition" toDictionary:encodedFace ifValueIsValid:face.hasRightEyePosition];
  [self putAFloat:face.rightEyeOpenProbability forKey:@"rightEyeOpenProbability" toDictionary:encodedFace ifValueIsValid:face.hasRightEyeOpenProbability];
  
  [self putAPoint:face.leftCheekPosition forKey:@"leftCheekPosition" toDictionary:encodedFace ifValueIsValid:face.hasLeftCheekPosition];
  [self putAPoint:face.rightCheekPosition forKey:@"rightCheekPosition" toDictionary:encodedFace ifValueIsValid:face.hasRightCheekPosition];
  
  [self putAPoint:face.leftMouthPosition forKey:@"leftMouthPosition" toDictionary:encodedFace ifValueIsValid:face.hasLeftMouthPosition];
  [self putAPoint:face.mouthPosition forKey:@"mouthPosition" toDictionary:encodedFace ifValueIsValid:face.hasMouthPosition];
  [self putAPoint:face.rightMouthPosition forKey:@"rightMouthPosition" toDictionary:encodedFace ifValueIsValid:face.hasRightMouthPosition];
  [self putAPoint:face.bottomMouthPosition forKey:@"bottomMouthPosition" toDictionary:encodedFace ifValueIsValid:face.hasBottomMouthPosition];
  
  [self putAPoint:face.noseBasePosition forKey:@"noseBasePosition" toDictionary:encodedFace ifValueIsValid:face.hasNoseBasePosition];
  
  [self putAFloat:face.headEulerAngleY forKey:@"yawAngle" toDictionary:encodedFace ifValueIsValid:face.hasHeadEulerAngleY];
  [self putAFloat:-(face.headEulerAngleZ - _rollAngleDegreesFromTransform) forKey:@"rollAngle" toDictionary:encodedFace ifValueIsValid:face.hasHeadEulerAngleZ];
  
  return encodedFace;
}

- (void)putAPoint:(CGPoint)point forKey:(NSString *)key toDictionary:(NSMutableDictionary *)dictionary ifValueIsValid:(BOOL)pointIsValid
{
  if (pointIsValid) {
    CGPoint transformedPoint = CGPointApplyAffineTransform(point, _transform);
    [dictionary setObject:@{ @"x" : @(transformedPoint.x), @"y" : @(transformedPoint.y) } forKey:key];
  }
}

- (void)putAFloat:(CGFloat)value forKey:(NSString *)key toDictionary:(NSMutableDictionary *)dictionary ifValueIsValid:(BOOL)floatIsValid
{
  if (floatIsValid) {
    [dictionary setObject:@(value) forKey:key];
  }
}

- (void)putAnInteger:(NSUInteger)value forKey:(NSString *)key toDictionary:(NSMutableDictionary *)dictionary ifValueIsValid:(BOOL)integerIsValid
{
  if (integerIsValid) {
    [dictionary setObject:@(value) forKey:key];
  }
}

- (CGFloat)rollAngleFromTransform:(CGAffineTransform)transform
{
  return atan2f(transform.b, transform.a);
}

- (CGFloat)radianAngleToDegrees:(CGFloat)angle
{
  return angle * (180 / M_PI);
}

@end
