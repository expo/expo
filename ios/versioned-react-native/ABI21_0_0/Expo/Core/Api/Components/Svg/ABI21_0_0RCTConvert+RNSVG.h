/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI21_0_0RCTConvert+RNSVG.h"
#import "ABI21_0_0RNSVGCGFloatArray.h"
#import <ReactABI21_0_0/ABI21_0_0RCTConvert.h>
#import "ABI21_0_0RNSVGCGFCRule.h"
#import "ABI21_0_0RNSVGVBMOS.h"
#import "ABI21_0_0RNSVGTextAnchor.h"
#import "ABI21_0_0RNSVGUnits.h"
#import "ABI21_0_0RNSVGPathParser.h"

@class ABI21_0_0RNSVGBrush;

@interface ABI21_0_0RCTConvert (ABI21_0_0RNSVG)

+ (ABI21_0_0RNSVGTextAnchor)ABI21_0_0RNSVGTextAnchor:(id)json;
+ (ABI21_0_0RNSVGCGFCRule)ABI21_0_0RNSVGCGFCRule:(id)json;
+ (ABI21_0_0RNSVGVBMOS)ABI21_0_0RNSVGVBMOS:(id)json;
+ (ABI21_0_0RNSVGUnits)ABI21_0_0RNSVGUnits:(id)json;
+ (ABI21_0_0RNSVGCGFloatArray)ABI21_0_0RNSVGCGFloatArray:(id)json;
+ (ABI21_0_0RNSVGBrush *)ABI21_0_0RNSVGBrush:(id)json;
+ (ABI21_0_0RNSVGPathParser *)ABI21_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI21_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI21_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI21_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
