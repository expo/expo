/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI19_0_0RCTConvert+RNSVG.h"
#import "ABI19_0_0RNSVGCGFloatArray.h"
#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import "ABI19_0_0RNSVGCGFCRule.h"
#import "ABI19_0_0RNSVGVBMOS.h"
#import "ABI19_0_0RNSVGTextAnchor.h"
#import "ABI19_0_0RNSVGUnits.h"
#import "ABI19_0_0RNSVGPathParser.h"

@class ABI19_0_0RNSVGBrush;

@interface ABI19_0_0RCTConvert (ABI19_0_0RNSVG)

+ (ABI19_0_0RNSVGTextAnchor)ABI19_0_0RNSVGTextAnchor:(id)json;
+ (ABI19_0_0RNSVGCGFCRule)ABI19_0_0RNSVGCGFCRule:(id)json;
+ (ABI19_0_0RNSVGVBMOS)ABI19_0_0RNSVGVBMOS:(id)json;
+ (ABI19_0_0RNSVGUnits)ABI19_0_0RNSVGUnits:(id)json;
+ (ABI19_0_0RNSVGCGFloatArray)ABI19_0_0RNSVGCGFloatArray:(id)json;
+ (ABI19_0_0RNSVGBrush *)ABI19_0_0RNSVGBrush:(id)json;
+ (ABI19_0_0RNSVGPathParser *)ABI19_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI19_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI19_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI19_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
