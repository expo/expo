/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI26_0_0RCTConvert+RNSVG.h"
#import "ABI26_0_0RNSVGCGFloatArray.h"
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import "ABI26_0_0RNSVGCGFCRule.h"
#import "ABI26_0_0RNSVGVBMOS.h"
#import "ABI26_0_0RNSVGUnits.h"
#import "ABI26_0_0RNSVGPathParser.h"

@class ABI26_0_0RNSVGBrush;

@interface ABI26_0_0RCTConvert (ABI26_0_0RNSVG)

+ (ABI26_0_0RNSVGCGFCRule)ABI26_0_0RNSVGCGFCRule:(id)json;
+ (ABI26_0_0RNSVGVBMOS)ABI26_0_0RNSVGVBMOS:(id)json;
+ (ABI26_0_0RNSVGUnits)ABI26_0_0RNSVGUnits:(id)json;
+ (ABI26_0_0RNSVGCGFloatArray)ABI26_0_0RNSVGCGFloatArray:(id)json;
+ (ABI26_0_0RNSVGBrush *)ABI26_0_0RNSVGBrush:(id)json;
+ (ABI26_0_0RNSVGPathParser *)ABI26_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI26_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI26_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI26_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
