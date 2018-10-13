//
//  EXCameraPointTransformCalculator.h
//  Exponent
//
//  Created by Stanisław Chmiela on 30.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>

@interface EXFaceDetectorPointTransformCalculator : NSObject

- (instancetype)initToTransformFromOrientation:(AVCaptureVideoOrientation)orientation toOrientation:(AVCaptureVideoOrientation)toOrientation forVideoWidth:(CGFloat)videoWidth andVideoHeight:(CGFloat)videoHeight;

- (CGAffineTransform)transform;

@end
