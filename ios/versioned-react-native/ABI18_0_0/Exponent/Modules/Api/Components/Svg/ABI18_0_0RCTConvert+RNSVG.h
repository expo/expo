/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI18_0_0RCTConvert+RNSVG.h"
#import "ABI18_0_0RNSVGCGFloatArray.h"
#import <ReactABI18_0_0/ABI18_0_0RCTConvert.h>
#import "ABI18_0_0RNSVGCGFCRule.h"
#import "ABI18_0_0RNSVGVBMOS.h"
#import "ABI18_0_0RNSVGTextAnchor.h"
#import "ABI18_0_0RNSVGUnits.h"
#import "ABI18_0_0RNSVGPathParser.h"

@class ABI18_0_0RNSVGBrush;

@interface ABI18_0_0RCTConvert (ABI18_0_0RNSVG)

+ (ABI18_0_0RNSVGTextAnchor)ABI18_0_0RNSVGTextAnchor:(id)json;
+ (ABI18_0_0RNSVGCGFCRule)ABI18_0_0RNSVGCGFCRule:(id)json;
+ (ABI18_0_0RNSVGVBMOS)ABI18_0_0RNSVGVBMOS:(id)json;
+ (ABI18_0_0RNSVGUnits)ABI18_0_0RNSVGUnits:(id)json;
+ (ABI18_0_0RNSVGCGFloatArray)ABI18_0_0RNSVGCGFloatArray:(id)json;
+ (ABI18_0_0RNSVGBrush *)ABI18_0_0RNSVGBrush:(id)json;
+ (ABI18_0_0RNSVGPathParser *)ABI18_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI18_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI18_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI18_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
