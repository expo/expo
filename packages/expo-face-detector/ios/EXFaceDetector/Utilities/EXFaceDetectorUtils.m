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

NSString *const EXGMVDataOutputWidthKey = @"Width";
NSString *const EXGMVDataOutputHeightKey = @"Height";

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
               @"none" : @(FIRVisionFaceDetectorClassificationModeAll)
               }
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
