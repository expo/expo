/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI35_0_0RCTConvert+RNSVG.h"
#import <ReactABI35_0_0/ABI35_0_0RCTConvert.h>
#import "ABI35_0_0RNSVGCGFCRule.h"
#import "ABI35_0_0RNSVGVBMOS.h"
#import "ABI35_0_0RNSVGUnits.h"
#import "ABI35_0_0RNSVGLength.h"
#import "ABI35_0_0RNSVGPathParser.h"

@class ABI35_0_0RNSVGBrush;

@interface ABI35_0_0RCTConvert (ABI35_0_0RNSVG)

+ (ABI35_0_0RNSVGLength*)ABI35_0_0RNSVGLength:(id)json;
+ (NSArray<ABI35_0_0RNSVGLength *>*)ABI35_0_0RNSVGLengthArray:(id)json;
+ (ABI35_0_0RNSVGCGFCRule)ABI35_0_0RNSVGCGFCRule:(id)json;
+ (ABI35_0_0RNSVGVBMOS)ABI35_0_0RNSVGVBMOS:(id)json;
+ (ABI35_0_0RNSVGUnits)ABI35_0_0RNSVGUnits:(id)json;
+ (ABI35_0_0RNSVGBrush *)ABI35_0_0RNSVGBrush:(id)json;
+ (ABI35_0_0RNSVGPathParser *)ABI35_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI35_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI35_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI35_0_0RNSVGCGGradient:(id)json;

@end
