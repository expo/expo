/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI30_0_0RCTConvert+RNSVG.h"
#import "ABI30_0_0RNSVGCGFloatArray.h"
#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>
#import "ABI30_0_0RNSVGCGFCRule.h"
#import "ABI30_0_0RNSVGVBMOS.h"
#import "ABI30_0_0RNSVGUnits.h"
#import "ABI30_0_0RNSVGPathParser.h"

@class ABI30_0_0RNSVGBrush;

@interface ABI30_0_0RCTConvert (ABI30_0_0RNSVG)

+ (ABI30_0_0RNSVGCGFCRule)ABI30_0_0RNSVGCGFCRule:(id)json;
+ (ABI30_0_0RNSVGVBMOS)ABI30_0_0RNSVGVBMOS:(id)json;
+ (ABI30_0_0RNSVGUnits)ABI30_0_0RNSVGUnits:(id)json;
+ (ABI30_0_0RNSVGCGFloatArray)ABI30_0_0RNSVGCGFloatArray:(id)json;
+ (ABI30_0_0RNSVGBrush *)ABI30_0_0RNSVGBrush:(id)json;
+ (ABI30_0_0RNSVGPathParser *)ABI30_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI30_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI30_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI30_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
