/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI37_0_0RCTConvert+RNSVG.h"
#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import "ABI37_0_0RNSVGCGFCRule.h"
#import "ABI37_0_0RNSVGVBMOS.h"
#import "ABI37_0_0RNSVGUnits.h"
#import "ABI37_0_0RNSVGLength.h"
#import "ABI37_0_0RNSVGPathParser.h"

@class ABI37_0_0RNSVGBrush;

@interface ABI37_0_0RCTConvert (ABI37_0_0RNSVG)

+ (ABI37_0_0RNSVGLength*)ABI37_0_0RNSVGLength:(id)json;
+ (NSArray<ABI37_0_0RNSVGLength *>*)ABI37_0_0RNSVGLengthArray:(id)json;
+ (ABI37_0_0RNSVGCGFCRule)ABI37_0_0RNSVGCGFCRule:(id)json;
+ (ABI37_0_0RNSVGVBMOS)ABI37_0_0RNSVGVBMOS:(id)json;
+ (ABI37_0_0RNSVGUnits)ABI37_0_0RNSVGUnits:(id)json;
+ (ABI37_0_0RNSVGBrush *)ABI37_0_0RNSVGBrush:(id)json;
+ (ABI37_0_0RNSVGPathParser *)ABI37_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI37_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI37_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI37_0_0RNSVGCGGradient:(id)json;

@end
