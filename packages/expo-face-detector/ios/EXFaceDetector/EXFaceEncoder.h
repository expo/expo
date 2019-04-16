//
//  EXFaceEncoder.h
//  Exponent
//
//  Created by Stanisław Chmiela on 23.10.2017.
//  Copyright © 2017 650 Industries. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <GoogleMobileVision/GoogleMobileVision.h>
#import "Firebase.h"

@interface EXFaceEncoder : NSObject

- (instancetype)initWithTransform:(CGAffineTransform)transform;

- (NSDictionary *)encode:(FIRVisionFace *)face;

@end
