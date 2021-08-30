//
//  EXFaceDetectorUtils.m
//  Exponent
//
//  Created by Stanisław Chmiela on 22.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXFaceDetector/EXFaceDetectorUtils.h>
#import <EXFaceDetector/EXCSBufferOrientationCalculator.h>

NSString *const EXGMVDataOutputWidthKey = @"Width";
NSString *const EXGMVDataOutputHeightKey = @"Height";

static const NSString *kModeOptionName = @"mode";
static const NSString *kDetectLandmarksOptionName = @"detectLandmarks";
static const NSString *kRunClassificationsOptionName = @"runClassifications";
static const NSString *kTrackingEnabled = @"tracking";

@implementation EXFaceDetectorUtils

+ (NSDictionary *)constantsToExport
{
  return @{
           @"Mode" : @{
               @"fast" : @(MLKFaceDetectorPerformanceModeFast),
               @"accurate" : @(MLKFaceDetectorPerformanceModeAccurate)
               },
           @"Landmarks" : @{
               @"all" : @(MLKFaceDetectorLandmarkModeAll),
               @"none" : @(MLKFaceDetectorLandmarkModeNone)
               },
           @"Classifications" : @{
               @"all" : @(MLKFaceDetectorClassificationModeAll),
               @"none" : @(MLKFaceDetectorClassificationModeNone)
               }
           };
}

+ (BOOL)didOptionsChange:(MLKFaceDetectorOptions *)options
             comparingTo:(MLKFaceDetectorOptions *)other
{
  return options.performanceMode == other.performanceMode &&
  options.classificationMode == other.classificationMode &&
  options.contourMode == other.contourMode &&
  options.minFaceSize == other.minFaceSize &&
  options.landmarkMode == other.landmarkMode &&
  options.trackingEnabled == other.trackingEnabled;
}

+ (MLKFaceDetectorOptions *)createCopy:(MLKFaceDetectorOptions *)from
{
  MLKFaceDetectorOptions *options = [MLKFaceDetectorOptions new];
  options.performanceMode = from.performanceMode;
  options.classificationMode = from.classificationMode;
  options.contourMode = from.contourMode;
  options.minFaceSize = from.minFaceSize;
  options.landmarkMode = from.landmarkMode;
  options.trackingEnabled = from.trackingEnabled;
  return options;
}


+ (MLKFaceDetectorOptions *) mapOptions:(NSDictionary*)options {
  return [self newOptions:[MLKFaceDetectorOptions new] withValues:options];
}

+ (MLKFaceDetectorOptions *) newOptions:(MLKFaceDetectorOptions*)options withValues:(NSDictionary *)values
{
  MLKFaceDetectorOptions *result = [self createCopy:options];
  if([values objectForKey:kModeOptionName]) {
    result.performanceMode = [values[kModeOptionName] longValue];
  }
  if([values objectForKey:kDetectLandmarksOptionName]) {
    result.landmarkMode = [values[kDetectLandmarksOptionName] longValue];
  }
  if([values objectForKey:kRunClassificationsOptionName]) {
    result.classificationMode = [values[kRunClassificationsOptionName] longValue];
  }
  if([values objectForKey:kTrackingEnabled]) {
    result.trackingEnabled = [values[kTrackingEnabled] boolValue];
  }
  return result;
}

+ (BOOL)areOptionsEqual:(MLKFaceDetectorOptions *)first to:(MLKFaceDetectorOptions*)second {
  return [self didOptionsChange:first comparingTo:second];
}

+ (NSDictionary *)defaultFaceDetectorOptions
{
  return @{
           kModeOptionName: @(MLKFaceDetectorPerformanceModeFast),
           kDetectLandmarksOptionName: @(MLKFaceDetectorLandmarkModeNone),
           kRunClassificationsOptionName: @(MLKFaceDetectorClassificationModeNone)
           };
}

+ (int)toCGImageOrientation:(UIImageOrientation)imageOrientation
{
  switch (imageOrientation) {
    case UIImageOrientationUp:
      return kCGImagePropertyOrientationUp;
    case UIImageOrientationUpMirrored:
      return kCGImagePropertyOrientationUpMirrored;
    case UIImageOrientationDown:
      return kCGImagePropertyOrientationDown;
    case UIImageOrientationDownMirrored:
      return kCGImagePropertyOrientationDownMirrored;
    case UIImageOrientationRight:
      return kCGImagePropertyOrientationRight;
    case UIImageOrientationRightMirrored:
      return kCGImagePropertyOrientationRightMirrored;
    case UIImageOrientationLeft:
      return kCGImagePropertyOrientationLeft;
    case UIImageOrientationLeftMirrored:
      return kCGImagePropertyOrientationLeftMirrored;
  }
};

# pragma mark - Encoder helpers

+ (EXFaceDetectionAngleTransformBlock)angleTransformerFromTransform:(CGAffineTransform)transform
{
  return ^(float angle) {
    return (float)(angle - (atan2(transform.b, transform.a) * (180 / M_PI)));
  };
}

@end
