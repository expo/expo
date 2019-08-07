//
//  EXFaceEncoder.h
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <GoogleMobileVision/GoogleMobileVision.h>
#import <EXFaceDetector/EXFaceDetectorUtils.h>
#import <Firebase/Firebase.h>

@interface EXFaceEncoder : NSObject

- (instancetype)initWithTransform:(CGAffineTransform)transform;
- (instancetype)initWithRotationTransform:(EXFaceDetectionAngleTransformBlock)transform;
- (instancetype)initWithTransform:(CGAffineTransform)transform withRotationTransform:(EXFaceDetectionAngleTransformBlock)rotationTransform;

- (NSDictionary *)encode:(FIRVisionFace *)face;

@end
