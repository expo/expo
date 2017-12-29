/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI24_0_0RCTConvert+RNSVG.h"
#import "ABI24_0_0RNSVGCGFloatArray.h"
#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>
#import "ABI24_0_0RNSVGCGFCRule.h"
#import "ABI24_0_0RNSVGVBMOS.h"
#import "ABI24_0_0RNSVGTextAnchor.h"
#import "ABI24_0_0RNSVGUnits.h"
#import "ABI24_0_0RNSVGPathParser.h"

@class ABI24_0_0RNSVGBrush;

@interface ABI24_0_0RCTConvert (ABI24_0_0RNSVG)

+ (ABI24_0_0RNSVGTextAnchor)ABI24_0_0RNSVGTextAnchor:(id)json;
+ (ABI24_0_0RNSVGCGFCRule)ABI24_0_0RNSVGCGFCRule:(id)json;
+ (ABI24_0_0RNSVGVBMOS)ABI24_0_0RNSVGVBMOS:(id)json;
+ (ABI24_0_0RNSVGUnits)ABI24_0_0RNSVGUnits:(id)json;
+ (ABI24_0_0RNSVGCGFloatArray)ABI24_0_0RNSVGCGFloatArray:(id)json;
+ (ABI24_0_0RNSVGBrush *)ABI24_0_0RNSVGBrush:(id)json;
+ (ABI24_0_0RNSVGPathParser *)ABI24_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI24_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI24_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI24_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
