/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI33_0_0RCTConvert+RNSVG.h"
#import <ReactABI33_0_0/ABI33_0_0RCTConvert.h>
#import "ABI33_0_0RNSVGCGFCRule.h"
#import "ABI33_0_0RNSVGVBMOS.h"
#import "ABI33_0_0RNSVGUnits.h"
#import "ABI33_0_0RNSVGLength.h"
#import "ABI33_0_0RNSVGPathParser.h"

@class ABI33_0_0RNSVGBrush;

@interface ABI33_0_0RCTConvert (ABI33_0_0RNSVG)

+ (ABI33_0_0RNSVGLength*)ABI33_0_0RNSVGLength:(id)json;
+ (NSArray<ABI33_0_0RNSVGLength *>*)ABI33_0_0RNSVGLengthArray:(id)json;
+ (ABI33_0_0RNSVGCGFCRule)ABI33_0_0RNSVGCGFCRule:(id)json;
+ (ABI33_0_0RNSVGVBMOS)ABI33_0_0RNSVGVBMOS:(id)json;
+ (ABI33_0_0RNSVGUnits)ABI33_0_0RNSVGUnits:(id)json;
+ (ABI33_0_0RNSVGBrush *)ABI33_0_0RNSVGBrush:(id)json;
+ (ABI33_0_0RNSVGPathParser *)ABI33_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI33_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI33_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI33_0_0RNSVGCGGradient:(id)json;

@end
