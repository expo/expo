//
//  ABI48_0_0EXFaceDetectorUtils.h
//  Exponent
//
//  Created by Stanisław Chmiela on 22.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <GoogleMLKit/MLKit.h>

typedef float (^ABI48_0_0EXFaceDetectionAngleTransformBlock)(float);

@interface ABI48_0_0EXFaceDetectorUtils : NSObject

+ (NSDictionary *)constantsToExport;

+ (BOOL)areOptionsEqual:(MLKFaceDetectorOptions *)first
                     to:(MLKFaceDetectorOptions *)second;

+ (MLKFaceDetectorOptions *)mapOptions:(NSDictionary*)options;

+ (MLKFaceDetectorOptions *)newOptions:(MLKFaceDetectorOptions*)options
                            withValues:(NSDictionary *)values;

+ (ABI48_0_0EXFaceDetectionAngleTransformBlock)angleTransformerFromTransform:(CGAffineTransform)transform;

+ (int)toCGImageOrientation:(UIImageOrientation)imageOrientation;

+ (NSDictionary*)defaultFaceDetectorOptions;

@end
