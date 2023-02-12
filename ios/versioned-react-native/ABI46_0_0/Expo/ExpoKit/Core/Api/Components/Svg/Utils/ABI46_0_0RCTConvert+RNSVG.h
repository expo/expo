/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI46_0_0RCTConvert+RNSVG.h"
#import <ABI46_0_0React/ABI46_0_0RCTConvert.h>
#import "ABI46_0_0RNSVGCGFCRule.h"
#import "ABI46_0_0RNSVGVBMOS.h"
#import "ABI46_0_0RNSVGUnits.h"
#import "ABI46_0_0RNSVGLength.h"
#import "ABI46_0_0RNSVGPathParser.h"

@class ABI46_0_0RNSVGBrush;

@interface ABI46_0_0RCTConvert (ABI46_0_0RNSVG)

+ (ABI46_0_0RNSVGLength*)ABI46_0_0RNSVGLength:(id)json;
+ (NSArray<ABI46_0_0RNSVGLength *>*)ABI46_0_0RNSVGLengthArray:(id)json;
+ (ABI46_0_0RNSVGCGFCRule)ABI46_0_0RNSVGCGFCRule:(id)json;
+ (ABI46_0_0RNSVGVBMOS)ABI46_0_0RNSVGVBMOS:(id)json;
+ (ABI46_0_0RNSVGUnits)ABI46_0_0RNSVGUnits:(id)json;
+ (ABI46_0_0RNSVGBrush *)ABI46_0_0RNSVGBrush:(id)json;
+ (ABI46_0_0RNSVGPathParser *)ABI46_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI46_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (ABI46_0_0RNSVGColor *)ABI46_0_0RNSVGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI46_0_0RNSVGCGGradient:(id)json;

@end
