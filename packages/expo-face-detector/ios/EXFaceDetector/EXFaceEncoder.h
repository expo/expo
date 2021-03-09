//
//  EXFaceEncoder.h
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <EXFaceDetector/EXFaceDetectorUtils.h>

@interface EXFaceEncoder : NSObject

- (instancetype)initWithTransform:(CGAffineTransform)transform;
- (instancetype)initWithRotationTransform:(EXFaceDetectionAngleTransformBlock)transform;
- (instancetype)initWithTransform:(CGAffineTransform)transform withRotationTransform:(EXFaceDetectionAngleTransformBlock)rotationTransform;

- (NSDictionary *)encode:(MLKFace *)face;

@end
