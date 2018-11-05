/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI28_0_0RCTConvert+RNSVG.h"
#import "ABI28_0_0RNSVGCGFloatArray.h"
#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import "ABI28_0_0RNSVGCGFCRule.h"
#import "ABI28_0_0RNSVGVBMOS.h"
#import "ABI28_0_0RNSVGUnits.h"
#import "ABI28_0_0RNSVGPathParser.h"

@class ABI28_0_0RNSVGBrush;

@interface ABI28_0_0RCTConvert (ABI28_0_0RNSVG)

+ (ABI28_0_0RNSVGCGFCRule)ABI28_0_0RNSVGCGFCRule:(id)json;
+ (ABI28_0_0RNSVGVBMOS)ABI28_0_0RNSVGVBMOS:(id)json;
+ (ABI28_0_0RNSVGUnits)ABI28_0_0RNSVGUnits:(id)json;
+ (ABI28_0_0RNSVGCGFloatArray)ABI28_0_0RNSVGCGFloatArray:(id)json;
+ (ABI28_0_0RNSVGBrush *)ABI28_0_0RNSVGBrush:(id)json;
+ (ABI28_0_0RNSVGPathParser *)ABI28_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI28_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI28_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI28_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
