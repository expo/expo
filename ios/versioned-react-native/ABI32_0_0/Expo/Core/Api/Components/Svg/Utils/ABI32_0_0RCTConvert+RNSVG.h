/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI32_0_0RCTConvert+RNSVG.h"
#import <ReactABI32_0_0/ABI32_0_0RCTConvert.h>
#import "ABI32_0_0RNSVGCGFCRule.h"
#import "ABI32_0_0RNSVGVBMOS.h"
#import "ABI32_0_0RNSVGUnits.h"
#import "ABI32_0_0RNSVGLength.h"
#import "ABI32_0_0RNSVGPathParser.h"

@class ABI32_0_0RNSVGBrush;

@interface ABI32_0_0RCTConvert (ABI32_0_0RNSVG)

+ (ABI32_0_0RNSVGLength*)ABI32_0_0RNSVGLength:(id)json;
+ (NSArray<ABI32_0_0RNSVGLength *>*)ABI32_0_0RNSVGLengthArray:(id)json;
+ (ABI32_0_0RNSVGCGFCRule)ABI32_0_0RNSVGCGFCRule:(id)json;
+ (ABI32_0_0RNSVGVBMOS)ABI32_0_0RNSVGVBMOS:(id)json;
+ (ABI32_0_0RNSVGUnits)ABI32_0_0RNSVGUnits:(id)json;
+ (ABI32_0_0RNSVGBrush *)ABI32_0_0RNSVGBrush:(id)json;
+ (ABI32_0_0RNSVGPathParser *)ABI32_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI32_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI32_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI32_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
