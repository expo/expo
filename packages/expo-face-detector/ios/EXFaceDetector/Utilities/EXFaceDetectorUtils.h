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

+ (angleTransformer)angleTransformerFromTransform:(CGAffineTransform)transform;

@end
