//
//  ABI37_0_0EXFaceDetectorUtils.h
//  Exponent
//
//  Created by Stanisław Chmiela on 22.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <Firebase/Firebase.h>

typedef float (^ABI37_0_0EXFaceDetectionAngleTransformBlock)(float);

@interface ABI37_0_0EXFaceDetectorUtils : NSObject

+ (NSDictionary *)constantsToExport;

+ (BOOL) areOptionsEqual:(FIRVisionFaceDetectorOptions *)first to:(FIRVisionFaceDetectorOptions *)second;

+ (FIRVisionFaceDetectorOptions *)mapOptions:(NSDictionary*)options;

+ (FIRVisionFaceDetectorOptions *) newOptions:(FIRVisionFaceDetectorOptions* )options withValues:(NSDictionary *)values;

+ (ABI37_0_0EXFaceDetectionAngleTransformBlock)angleTransformerFromTransform:(CGAffineTransform)transform;

+ (int)toCGImageOrientation:(UIImageOrientation)imageOrientation;

+ (NSDictionary*)defaultFaceDetectorOptions;

@end
