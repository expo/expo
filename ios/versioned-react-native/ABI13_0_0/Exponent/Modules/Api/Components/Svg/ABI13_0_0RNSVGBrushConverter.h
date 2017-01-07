/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI13_0_0RCTConvert+RNSVG.h"
#import "ABI13_0_0RNSVGBrushType.h"

@interface ABI13_0_0RNSVGBrushConverter : NSObject

@property (nonatomic, copy) NSArray<NSString *> *points;
@property (nonatomic, copy) NSArray<NSNumber *> *colors;
@property (nonatomic, assign) ABI13_0_0RNSVGBrushType type;

- (void) drawLinearGradient:(CGContextRef)context;

- (void) drawRidialGradient:(CGContextRef)context;

@end
