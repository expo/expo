/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI31_0_0RCTConvert+RNSVG.h"
#import <ReactABI31_0_0/ABI31_0_0RCTConvert.h>
#import "ABI31_0_0RNSVGCGFCRule.h"
#import "ABI31_0_0RNSVGVBMOS.h"
#import "ABI31_0_0RNSVGUnits.h"
#import "ABI31_0_0RNSVGLength.h"
#import "ABI31_0_0RNSVGPathParser.h"

@class ABI31_0_0RNSVGBrush;

@interface ABI31_0_0RCTConvert (ABI31_0_0RNSVG)

+ (ABI31_0_0RNSVGLength*)ABI31_0_0RNSVGLength:(id)json;
+ (NSArray<ABI31_0_0RNSVGLength *>*)ABI31_0_0RNSVGLengthArray:(id)json;
+ (ABI31_0_0RNSVGCGFCRule)ABI31_0_0RNSVGCGFCRule:(id)json;
+ (ABI31_0_0RNSVGVBMOS)ABI31_0_0RNSVGVBMOS:(id)json;
+ (ABI31_0_0RNSVGUnits)ABI31_0_0RNSVGUnits:(id)json;
+ (ABI31_0_0RNSVGBrush *)ABI31_0_0RNSVGBrush:(id)json;
+ (ABI31_0_0RNSVGPathParser *)ABI31_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI31_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI31_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI31_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
