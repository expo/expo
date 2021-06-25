/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI40_0_0RCTConvert+RNSVG.h"
#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>
#import "ABI40_0_0RNSVGCGFCRule.h"
#import "ABI40_0_0RNSVGVBMOS.h"
#import "ABI40_0_0RNSVGUnits.h"
#import "ABI40_0_0RNSVGLength.h"
#import "ABI40_0_0RNSVGPathParser.h"

@class ABI40_0_0RNSVGBrush;

@interface ABI40_0_0RCTConvert (ABI40_0_0RNSVG)

+ (ABI40_0_0RNSVGLength*)ABI40_0_0RNSVGLength:(id)json;
+ (NSArray<ABI40_0_0RNSVGLength *>*)ABI40_0_0RNSVGLengthArray:(id)json;
+ (ABI40_0_0RNSVGCGFCRule)ABI40_0_0RNSVGCGFCRule:(id)json;
+ (ABI40_0_0RNSVGVBMOS)ABI40_0_0RNSVGVBMOS:(id)json;
+ (ABI40_0_0RNSVGUnits)ABI40_0_0RNSVGUnits:(id)json;
+ (ABI40_0_0RNSVGBrush *)ABI40_0_0RNSVGBrush:(id)json;
+ (ABI40_0_0RNSVGPathParser *)ABI40_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI40_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI40_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI40_0_0RNSVGCGGradient:(id)json;

@end
