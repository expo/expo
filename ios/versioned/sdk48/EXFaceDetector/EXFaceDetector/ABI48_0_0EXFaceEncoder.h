//
//  ABI48_0_0EXFaceEncoder.h
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <ABI48_0_0EXFaceDetector/ABI48_0_0EXFaceDetectorUtils.h>

@interface ABI48_0_0EXFaceEncoder : NSObject

- (instancetype)initWithTransform:(CGAffineTransform)transform;
- (instancetype)initWithRotationTransform:(ABI48_0_0EXFaceDetectionAngleTransformBlock)transform;
- (instancetype)initWithTransform:(CGAffineTransform)transform withRotationTransform:(ABI48_0_0EXFaceDetectionAngleTransformBlock)rotationTransform;

- (NSDictionary *)encode:(MLKFace *)face;

@end
