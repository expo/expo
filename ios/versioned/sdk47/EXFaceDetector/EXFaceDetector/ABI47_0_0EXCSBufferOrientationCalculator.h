//
//  ABI47_0_0EXCameraPointTransformCalculator.h
//  Exponent
//
//  Created by Stanisław Chmiela on 30.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>

@interface ABI47_0_0EXCSBufferOrientationCalculator : NSObject

+ (CGAffineTransform)pointTransformForInterfaceOrientation:(UIInterfaceOrientation)orientation
                                            forBufferWidth:(CGFloat)bufferWidth
                                           andBufferHeight:(CGFloat)bufferHeight
                                             andVideoWidth:(CGFloat)videoWidth
                                            andVideoHeight:(CGFloat)videoHeight
                                               andMirrored:(BOOL)mirrored;

@end
