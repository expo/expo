/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreText/CoreText.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import "ABI47_0_0RCTConvert+RNSVG.h"
#import "ABI47_0_0RNSVGCGFCRule.h"
#import "ABI47_0_0RNSVGLength.h"
#import "ABI47_0_0RNSVGPathParser.h"
#import "ABI47_0_0RNSVGUnits.h"
#import "ABI47_0_0RNSVGVBMOS.h"

@class ABI47_0_0RNSVGBrush;

@interface ABI47_0_0RCTConvert (ABI47_0_0RNSVG)

+ (ABI47_0_0RNSVGLength *)ABI47_0_0RNSVGLength:(id)json;
+ (NSArray<ABI47_0_0RNSVGLength *> *)ABI47_0_0RNSVGLengthArray:(id)json;
+ (ABI47_0_0RNSVGCGFCRule)ABI47_0_0RNSVGCGFCRule:(id)json;
+ (ABI47_0_0RNSVGVBMOS)ABI47_0_0RNSVGVBMOS:(id)json;
+ (ABI47_0_0RNSVGUnits)ABI47_0_0RNSVGUnits:(id)json;
+ (ABI47_0_0RNSVGBrush *)ABI47_0_0RNSVGBrush:(id)json;
+ (ABI47_0_0RNSVGPathParser *)ABI47_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI47_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (ABI47_0_0RNSVGColor *)ABI47_0_0RNSVGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI47_0_0RNSVGCGGradient:(id)json;

@end
