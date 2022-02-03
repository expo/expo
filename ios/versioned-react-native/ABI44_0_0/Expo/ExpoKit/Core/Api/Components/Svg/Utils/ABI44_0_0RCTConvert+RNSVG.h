/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI44_0_0RCTConvert+RNSVG.h"
#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import "ABI44_0_0RNSVGCGFCRule.h"
#import "ABI44_0_0RNSVGVBMOS.h"
#import "ABI44_0_0RNSVGUnits.h"
#import "ABI44_0_0RNSVGLength.h"
#import "ABI44_0_0RNSVGPathParser.h"

@class ABI44_0_0RNSVGBrush;

@interface ABI44_0_0RCTConvert (ABI44_0_0RNSVG)

+ (ABI44_0_0RNSVGLength*)ABI44_0_0RNSVGLength:(id)json;
+ (NSArray<ABI44_0_0RNSVGLength *>*)ABI44_0_0RNSVGLengthArray:(id)json;
+ (ABI44_0_0RNSVGCGFCRule)ABI44_0_0RNSVGCGFCRule:(id)json;
+ (ABI44_0_0RNSVGVBMOS)ABI44_0_0RNSVGVBMOS:(id)json;
+ (ABI44_0_0RNSVGUnits)ABI44_0_0RNSVGUnits:(id)json;
+ (ABI44_0_0RNSVGBrush *)ABI44_0_0RNSVGBrush:(id)json;
+ (ABI44_0_0RNSVGPathParser *)ABI44_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI44_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI44_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI44_0_0RNSVGCGGradient:(id)json;

@end
