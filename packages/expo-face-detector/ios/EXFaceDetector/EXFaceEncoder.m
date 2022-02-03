//
//  EXFaceEncoder.m
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXFaceDetector/EXFaceEncoder.h>
#import <EXFaceDetector/EXFaceDetectorUtils.h>
#import <GoogleMLKit/MLKit.h>

#define cDefaultFloatComparisonEpsilon 0.0001
#define cModEqualFloatsWithEpsilon(dividend, divisor, modulo, epsilon) \
fabs( fmod(dividend, divisor) - modulo ) < epsilon
#define cModEqualFloats(dividend, divisor, modulo) \
cModEqualFloatsWithEpsilon(dividend, divisor, modulo, cDefaultFloatComparisonEpsilon)

@interface EXFaceEncoder()

@property (assign, nonatomic) BOOL swapWidthAndHeight;
@property CGAffineTransform transform;
@property EXFaceDetectionAngleTransformBlock angleTransformer;

@end

@implementation EXFaceEncoder

- (instancetype)init
{
  return [self initWithTransform:CGAffineTransformIdentity];
}

- (instancetype)initWithTransform:(CGAffineTransform)pointTransformer
{
  EXFaceDetectionAngleTransformBlock transformer = ^(float angle) {return angle;};
  return [self initWithTransform:pointTransformer withRotationTransform:transformer];
}

- (instancetype)initWithRotationTransform:(EXFaceDetectionAngleTransformBlock)rotationTransform
{
  return [self initWithTransform:CGAffineTransformIdentity withRotationTransform:rotationTransform];
}

- (instancetype)initWithTransform:(CGAffineTransform)transform withRotationTransform:(EXFaceDetectionAngleTransformBlock)rotationTransform
{
  self = [super init];
  if (self) {
    _transform = transform;
    _angleTransformer = rotationTransform;
  }
  return self;
}


- (NSDictionary *)encode:(MLKFace *)face
{
  CGRect bounds = CGRectApplyAffineTransform(face.frame, _transform);
  NSDictionary *initialDictionary = @{
                                      @"bounds" : @{
                                          @"size" : @{
                                              @"width" : @(bounds.size.width),
                                              @"height" : @(bounds.size.height)
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

  MLKFaceLandmark *leftEar = [face landmarkOfType:MLKFaceLandmarkTypeLeftEar];
  if(leftEar != nil) {
    [self putAPoint:leftEar.position forKey:@"leftEarPosition" toDictionary:encodedFace];
  }
  MLKFaceLandmark *rightEar = [face landmarkOfType:MLKFaceLandmarkTypeRightEar];
  if(rightEar != nil) {
    [self putAPoint:rightEar.position forKey:@"rightEarPosition" toDictionary:encodedFace];
  }

  MLKFaceLandmark *leftEye = [face landmarkOfType:MLKFaceLandmarkTypeLeftEye];
  if (leftEye != nil) {
    [self putAPoint:leftEye.position forKey:@"leftEyePosition" toDictionary:encodedFace];
  }
  MLKFaceLandmark *rightEye = [face landmarkOfType:MLKFaceLandmarkTypeRightEye];
  if(rightEye) {
    [self putAPoint:rightEye.position forKey:@"rightEyePosition" toDictionary:encodedFace];
  }

  [self putAFloat:face.leftEyeOpenProbability forKey:@"leftEyeOpenProbability" toDictionary:encodedFace ifValueIsValid:face.hasLeftEyeOpenProbability];
  [self putAFloat:face.rightEyeOpenProbability forKey:@"rightEyeOpenProbability" toDictionary:encodedFace ifValueIsValid:face.hasRightEyeOpenProbability];

  MLKFaceLandmark *leftCheek = [face landmarkOfType:MLKFaceLandmarkTypeLeftCheek];
  if(leftCheek) {
    [self putAPoint:leftCheek.position forKey:@"leftCheekPosition" toDictionary:encodedFace];
  }
  MLKFaceLandmark *rightCheek = [face landmarkOfType:MLKFaceLandmarkTypeRightCheek];
  if(rightCheek) {
    [self putAPoint:rightCheek.position forKey:@"rightCheekPosition" toDictionary:encodedFace];
  }

  MLKFaceLandmark *leftMouth = [face landmarkOfType:MLKFaceLandmarkTypeMouthLeft];
  if(leftMouth) {
    [self putAPoint:leftMouth.position forKey:@"leftMouthPosition" toDictionary:encodedFace];
  }
  MLKFaceLandmark *rightMouth = [face landmarkOfType:MLKFaceLandmarkTypeMouthRight];
  if(rightMouth) {
    [self putAPoint:rightMouth.position forKey:@"rightMouthPosition" toDictionary:encodedFace];
  }
  MLKFaceLandmark *bottomMouth = [face landmarkOfType:MLKFaceLandmarkTypeMouthBottom];
  if(bottomMouth) {
    [self putAPoint:bottomMouth.position forKey:@"bottomMouthPosition" toDictionary:encodedFace];
  }

  MLKFaceLandmark *noseBase = [face landmarkOfType:MLKFaceLandmarkTypeNoseBase];
  if(noseBase) {
    [self putAPoint:noseBase.position forKey:@"noseBasePosition" toDictionary:encodedFace];
  }

  [self putAFloat:face.headEulerAngleY forKey:@"yawAngle" toDictionary:encodedFace ifValueIsValid:face.hasHeadEulerAngleY];

  [self putAFloat:self.angleTransformer(face.headEulerAngleZ) forKey:@"rollAngle" toDictionary:encodedFace ifValueIsValid:face.hasHeadEulerAngleZ];

  return encodedFace;
}

- (void)putAPoint:(MLKVisionPoint *)point
           forKey:(NSString *)key
     toDictionary:(NSMutableDictionary *)dictionary
{
  CGPoint transformedPoint = CGPointApplyAffineTransform([self toPoint:point], _transform);
  [dictionary setObject:@{ @"x" : @(transformedPoint.x), @"y" : @(transformedPoint.y) } forKey:key];
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

- (CGPoint)toPoint:(MLKVisionPoint *)visionPoint
{
  return CGPointMake([visionPoint x], [visionPoint y]);
}

@end
