/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI25_0_0RCTConvert+RNSVG.h"
#import "ABI25_0_0RNSVGCGFloatArray.h"
#import <ReactABI25_0_0/ABI25_0_0RCTConvert.h>
#import "ABI25_0_0RNSVGCGFCRule.h"
#import "ABI25_0_0RNSVGVBMOS.h"
#import "ABI25_0_0RNSVGTextAnchor.h"
#import "ABI25_0_0RNSVGUnits.h"
#import "ABI25_0_0RNSVGPathParser.h"

@class ABI25_0_0RNSVGBrush;

@interface ABI25_0_0RCTConvert (ABI25_0_0RNSVG)

+ (ABI25_0_0RNSVGTextAnchor)ABI25_0_0RNSVGTextAnchor:(id)json;
+ (ABI25_0_0RNSVGCGFCRule)ABI25_0_0RNSVGCGFCRule:(id)json;
+ (ABI25_0_0RNSVGVBMOS)ABI25_0_0RNSVGVBMOS:(id)json;
+ (ABI25_0_0RNSVGUnits)ABI25_0_0RNSVGUnits:(id)json;
+ (ABI25_0_0RNSVGCGFloatArray)ABI25_0_0RNSVGCGFloatArray:(id)json;
+ (ABI25_0_0RNSVGBrush *)ABI25_0_0RNSVGBrush:(id)json;
+ (ABI25_0_0RNSVGPathParser *)ABI25_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI25_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI25_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI25_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
