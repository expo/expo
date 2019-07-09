//
//  EXFaceEncoder.m
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXFaceDetector/EXFaceEncoder.h>
#import <EXFaceDetector/EXFaceDetectorUtils.h>
#import <Firebase/Firebase.h>

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


- (NSDictionary *)encode:(FIRVisionFace *)face
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
  
  FIRVisionFaceLandmark *leftEar = [face landmarkOfType:FIRFaceLandmarkTypeLeftEar];
  if(leftEar != nil) {
    [self putAPoint:leftEar.position forKey:@"leftEarPosition" toDictionary:encodedFace];
  }
  FIRVisionFaceLandmark *rightEar = [face landmarkOfType:FIRFaceLandmarkTypeRightEar];
  if(rightEar != nil) {
    [self putAPoint:rightEar.position forKey:@"rightEarPosition" toDictionary:encodedFace];
  }
  
  FIRVisionFaceLandmark *leftEye = [face landmarkOfType:FIRFaceLandmarkTypeLeftEye];
  if (leftEye != nil) {
    [self putAPoint:leftEye.position forKey:@"leftEyePosition" toDictionary:encodedFace];
  }
  FIRVisionFaceLandmark *rightEye = [face landmarkOfType:FIRFaceLandmarkTypeRightEye];
  if(rightEye) {
    [self putAPoint:rightEye.position forKey:@"rightEyePosition" toDictionary:encodedFace];
  }
  
  [self putAFloat:face.leftEyeOpenProbability forKey:@"leftEyeOpenProbability" toDictionary:encodedFace ifValueIsValid:face.hasLeftEyeOpenProbability];
  [self putAFloat:face.rightEyeOpenProbability forKey:@"rightEyeOpenProbability" toDictionary:encodedFace ifValueIsValid:face.hasRightEyeOpenProbability];
  
  FIRVisionFaceLandmark *leftCheek = [face landmarkOfType:FIRFaceLandmarkTypeLeftCheek];
  if(leftCheek) {
    [self putAPoint:leftCheek.position forKey:@"leftCheekPosition" toDictionary:encodedFace];
  }
  FIRVisionFaceLandmark *rightCheek = [face landmarkOfType:FIRFaceLandmarkTypeRightCheek];
  if(rightCheek) {
    [self putAPoint:rightCheek.position forKey:@"rightCheekPosition" toDictionary:encodedFace];
  }
  
  FIRVisionFaceLandmark *leftMouth = [face landmarkOfType:FIRFaceLandmarkTypeMouthLeft];
  if(leftMouth) {
    [self putAPoint:leftMouth.position forKey:@"leftMouthPosition" toDictionary:encodedFace];
  }
  FIRVisionFaceLandmark *rightMouth = [face landmarkOfType:FIRFaceLandmarkTypeMouthRight];
  if(rightMouth) {
    [self putAPoint:rightMouth.position forKey:@"rightMouthPosition" toDictionary:encodedFace];
  }
  FIRVisionFaceLandmark *bottomMouth = [face landmarkOfType:FIRFaceLandmarkTypeMouthBottom];
  if(bottomMouth) {
    [self putAPoint:bottomMouth.position forKey:@"bottomMouthPosition" toDictionary:encodedFace];
  }
  
  FIRVisionFaceLandmark *noseBase = [face landmarkOfType:FIRFaceLandmarkTypeNoseBase];
  if(noseBase) {
    [self putAPoint:noseBase.position forKey:@"noseBasePosition" toDictionary:encodedFace];
  }
  
  [self putAFloat:face.headEulerAngleY forKey:@"yawAngle" toDictionary:encodedFace ifValueIsValid:face.hasHeadEulerAngleY];
  
  [self putAFloat:self.angleTransformer(face.headEulerAngleZ) forKey:@"rollAngle" toDictionary:encodedFace ifValueIsValid:face.hasHeadEulerAngleZ];
  
  return encodedFace;
}

- (void)putAPoint:(FIRVisionPoint *)point forKey:(NSString *)key toDictionary:(NSMutableDictionary *)dictionary
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

- (CGPoint)toPoint:(FIRVisionPoint *)visionPoint
{
  return CGPointMake([[visionPoint x] floatValue], [[visionPoint y] floatValue]);
}

@end
