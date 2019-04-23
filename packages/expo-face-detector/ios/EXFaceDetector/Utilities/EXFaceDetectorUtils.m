//
//  EXFaceDetectorUtils.m
//  Exponent
//
//  Created by Stanisław Chmiela on 22.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <EXFaceDetector/EXFaceDetectorUtils.h>
#import <EXFaceDetector/CSBufferOrientationCalculator.h>
#import "Firebase.h"
#import "FIRVisionFaceDetectorOptions+Immutbility.h"

NSString *const EXGMVDataOutputWidthKey = @"Width";
NSString *const EXGMVDataOutputHeightKey = @"Height";

static const NSString *kModeOptionName = @"mode";
static const NSString *kDetectLandmarksOptionName = @"detectLandmarks";
static const NSString *kRunClassificationsOptionName = @"runClassifications";

@implementation EXFaceDetectorUtils

+ (NSDictionary *)constantsToExport
{
  return @{
           @"Mode" : @{
               @"fast" : @(FIRVisionFaceDetectorPerformanceModeFast),
               @"accurate" : @(FIRVisionFaceDetectorPerformanceModeAccurate)
               },
           @"Landmarks" : @{
               @"all" : @(FIRVisionFaceDetectorLandmarkModeAll),
               @"none" : @(FIRVisionFaceDetectorLandmarkModeNone)
               },
           @"Classifications" : @{
               @"all" : @(FIRVisionFaceDetectorClassificationModeAll),
               @"none" : @(FIRVisionFaceDetectorClassificationModeNone)
               }
           };
}

+ (FIRVisionFaceDetectorOptions*) mapOptions:(NSDictionary*)options {
  return [self newOptions:[self defaultFIRVisionFaceDetectorOptions] withValues:options];
}

+ (FIRVisionFaceDetectorOptions*) newOptions:(FIRVisionFaceDetectorOptions*)options withValues:(NSDictionary*)values
{
  FIRVisionFaceDetectorOptions* result = [options createCopy];
  if([values objectForKey:kModeOptionName]) {
    result.performanceMode = [values[kModeOptionName] longValue];
  }
  if([values objectForKey:kDetectLandmarksOptionName]) {
    result.landmarkMode = [values[kDetectLandmarksOptionName] longValue];
  }
  if([values objectForKey:kRunClassificationsOptionName]) {
    result.classificationMode = [values[kRunClassificationsOptionName] longValue];
  }
  return result;
}

+ (BOOL) areOptionsEqual:(FIRVisionFaceDetectorOptions*)first to:(FIRVisionFaceDetectorOptions*)second {
  return [first optionsChanged:second];
}

+ (FIRVisionFaceDetectorOptions*)defaultFIRVisionFaceDetectorOptions
{
  return [FIRVisionFaceDetectorOptions new];
}

+ (NSDictionary*)defaultFaceDetectorOptions
{
  return @{
           kModeOptionName: @(FIRVisionFaceDetectorPerformanceModeFast),
           kDetectLandmarksOptionName: @(FIRVisionFaceDetectorLandmarkModeNone),
           kRunClassificationsOptionName: @(FIRVisionFaceDetectorClassificationModeNone)
           };
}

# pragma marg - encoder helpers

+ (angleTransformer)angleTransformerFromTransform:(CGAffineTransform)transform
{
  return ^(float angle) {
    return (float)(angle - (atan2(transform.b, transform.a) * (180 / M_PI)));
  };
}

@end
