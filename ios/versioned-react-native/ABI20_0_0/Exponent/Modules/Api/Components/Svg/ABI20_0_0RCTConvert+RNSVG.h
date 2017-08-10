/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI20_0_0RCTConvert+RNSVG.h"
#import "ABI20_0_0RNSVGCGFloatArray.h"
#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>
#import "ABI20_0_0RNSVGCGFCRule.h"
#import "ABI20_0_0RNSVGVBMOS.h"
#import "ABI20_0_0RNSVGTextAnchor.h"
#import "ABI20_0_0RNSVGUnits.h"
#import "ABI20_0_0RNSVGPathParser.h"

@class ABI20_0_0RNSVGBrush;

@interface ABI20_0_0RCTConvert (ABI20_0_0RNSVG)

+ (ABI20_0_0RNSVGTextAnchor)ABI20_0_0RNSVGTextAnchor:(id)json;
+ (ABI20_0_0RNSVGCGFCRule)ABI20_0_0RNSVGCGFCRule:(id)json;
+ (ABI20_0_0RNSVGVBMOS)ABI20_0_0RNSVGVBMOS:(id)json;
+ (ABI20_0_0RNSVGUnits)ABI20_0_0RNSVGUnits:(id)json;
+ (ABI20_0_0RNSVGCGFloatArray)ABI20_0_0RNSVGCGFloatArray:(id)json;
+ (ABI20_0_0RNSVGBrush *)ABI20_0_0RNSVGBrush:(id)json;
+ (ABI20_0_0RNSVGPathParser *)ABI20_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI20_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI20_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI20_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
