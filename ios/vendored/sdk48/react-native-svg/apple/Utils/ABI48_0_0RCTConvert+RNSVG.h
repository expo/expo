/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreText/CoreText.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import "ABI48_0_0RCTConvert+RNSVG.h"
#import "ABI48_0_0RNSVGCGFCRule.h"
#import "ABI48_0_0RNSVGLength.h"
#import "ABI48_0_0RNSVGPathParser.h"
#import "ABI48_0_0RNSVGUnits.h"
#import "ABI48_0_0RNSVGVBMOS.h"

@class ABI48_0_0RNSVGBrush;

@interface ABI48_0_0RCTConvert (ABI48_0_0RNSVG)

+ (ABI48_0_0RNSVGLength *)ABI48_0_0RNSVGLength:(id)json;
+ (NSArray<ABI48_0_0RNSVGLength *> *)ABI48_0_0RNSVGLengthArray:(id)json;
+ (ABI48_0_0RNSVGCGFCRule)ABI48_0_0RNSVGCGFCRule:(id)json;
+ (ABI48_0_0RNSVGVBMOS)ABI48_0_0RNSVGVBMOS:(id)json;
+ (ABI48_0_0RNSVGUnits)ABI48_0_0RNSVGUnits:(id)json;
+ (ABI48_0_0RNSVGBrush *)ABI48_0_0RNSVGBrush:(id)json;
+ (ABI48_0_0RNSVGPathParser *)ABI48_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI48_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (ABI48_0_0RNSVGColor *)ABI48_0_0RNSVGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI48_0_0RNSVGCGGradient:(id)json;

@end
