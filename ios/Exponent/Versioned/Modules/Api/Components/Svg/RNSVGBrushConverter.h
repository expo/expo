/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConvert+RNSVG.h"
#import "RNSVGBrushType.h"

@interface RNSVGBrushConverter : NSObject

@property (nonatomic, copy) NSArray<NSString *> *points;
@property (nonatomic, copy) NSArray<NSNumber *> *colors;
@property (nonatomic, assign) RNSVGBrushType type;

- (void) drawLinearGradient:(CGContextRef)context;

- (void) drawRidialGradient:(CGContextRef)context;

@end