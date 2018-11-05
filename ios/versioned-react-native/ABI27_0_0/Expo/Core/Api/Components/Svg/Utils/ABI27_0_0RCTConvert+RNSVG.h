/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI27_0_0RCTConvert+RNSVG.h"
#import "ABI27_0_0RNSVGCGFloatArray.h"
#import <ReactABI27_0_0/ABI27_0_0RCTConvert.h>
#import "ABI27_0_0RNSVGCGFCRule.h"
#import "ABI27_0_0RNSVGVBMOS.h"
#import "ABI27_0_0RNSVGUnits.h"
#import "ABI27_0_0RNSVGPathParser.h"

@class ABI27_0_0RNSVGBrush;

@interface ABI27_0_0RCTConvert (ABI27_0_0RNSVG)

+ (ABI27_0_0RNSVGCGFCRule)ABI27_0_0RNSVGCGFCRule:(id)json;
+ (ABI27_0_0RNSVGVBMOS)ABI27_0_0RNSVGVBMOS:(id)json;
+ (ABI27_0_0RNSVGUnits)ABI27_0_0RNSVGUnits:(id)json;
+ (ABI27_0_0RNSVGCGFloatArray)ABI27_0_0RNSVGCGFloatArray:(id)json;
+ (ABI27_0_0RNSVGBrush *)ABI27_0_0RNSVGBrush:(id)json;
+ (ABI27_0_0RNSVGPathParser *)ABI27_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI27_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI27_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI27_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
