//
//  EXFaceDetectorUtils.h
//  Exponent
//
//  Created by Stanisław Chmiela on 22.11.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import "Firebase.h"

typedef float (^angleTransformer)(float);

@interface EXFaceDetectorUtils : NSObject

+ (NSDictionary *)constantsToExport;

+ (BOOL) areOptionsEqual:(FIRVisionFaceDetectorOptions *)first to:(FIRVisionFaceDetectorOptions *)second;

+ (FIRVisionFaceDetectorOptions *)mapOptions:(NSDictionary*)options;

+ (FIRVisionFaceDetectorOptions *) newOptions:(FIRVisionFaceDetectorOptions* )options withValues:(NSDictionary *)values;

+ (angleTransformer)angleTransformerFromTransform:(CGAffineTransform)transform;

+ (NSDictionary*)defaultFaceDetectorOptions;

@end
