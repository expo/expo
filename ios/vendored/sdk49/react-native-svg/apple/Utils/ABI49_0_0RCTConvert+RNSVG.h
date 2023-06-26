/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreText/CoreText.h>
#import <QuartzCore/QuartzCore.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import "ABI49_0_0RCTConvert+RNSVG.h"
#import "ABI49_0_0RNSVGCGFCRule.h"
#import "ABI49_0_0RNSVGLength.h"
#import "ABI49_0_0RNSVGPathParser.h"
#import "ABI49_0_0RNSVGUnits.h"
#import "ABI49_0_0RNSVGVBMOS.h"

@class ABI49_0_0RNSVGBrush;

@interface ABI49_0_0RCTConvert (ABI49_0_0RNSVG)

+ (ABI49_0_0RNSVGLength *)ABI49_0_0RNSVGLength:(id)json;
+ (NSArray<ABI49_0_0RNSVGLength *> *)ABI49_0_0RNSVGLengthArray:(id)json;
+ (ABI49_0_0RNSVGCGFCRule)ABI49_0_0RNSVGCGFCRule:(id)json;
+ (ABI49_0_0RNSVGVBMOS)ABI49_0_0RNSVGVBMOS:(id)json;
+ (ABI49_0_0RNSVGUnits)ABI49_0_0RNSVGUnits:(id)json;
+ (ABI49_0_0RNSVGBrush *)ABI49_0_0RNSVGBrush:(id)json;
+ (ABI49_0_0RNSVGPathParser *)ABI49_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI49_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (ABI49_0_0RNSVGColor *)ABI49_0_0RNSVGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI49_0_0RNSVGCGGradient:(id)json;

@end
