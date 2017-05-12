/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI17_0_0RCTConvert+RNSVG.h"
#import "ABI17_0_0RNSVGCGFloatArray.h"
#import <ReactABI17_0_0/ABI17_0_0RCTConvert.h>
#import "ABI17_0_0RNSVGCGFCRule.h"
#import "ABI17_0_0RNSVGVBMOS.h"
#import "ABI17_0_0RNSVGTextAnchor.h"
#import "ABI17_0_0RNSVGUnits.h"
#import "ABI17_0_0RNSVGPathParser.h"

@class ABI17_0_0RNSVGBrush;

@interface ABI17_0_0RCTConvert (ABI17_0_0RNSVG)

+ (ABI17_0_0RNSVGTextAnchor)ABI17_0_0RNSVGTextAnchor:(id)json;
+ (ABI17_0_0RNSVGCGFCRule)ABI17_0_0RNSVGCGFCRule:(id)json;
+ (ABI17_0_0RNSVGVBMOS)ABI17_0_0RNSVGVBMOS:(id)json;
+ (ABI17_0_0RNSVGUnits)ABI17_0_0RNSVGUnits:(id)json;
+ (ABI17_0_0RNSVGCGFloatArray)ABI17_0_0RNSVGCGFloatArray:(id)json;
+ (ABI17_0_0RNSVGBrush *)ABI17_0_0RNSVGBrush:(id)json;
+ (ABI17_0_0RNSVGPathParser *)ABI17_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI17_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI17_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI17_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
