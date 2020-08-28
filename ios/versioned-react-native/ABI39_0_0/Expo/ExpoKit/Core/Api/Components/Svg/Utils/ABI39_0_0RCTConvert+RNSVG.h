/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI39_0_0RCTConvert+RNSVG.h"
#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>
#import "ABI39_0_0RNSVGCGFCRule.h"
#import "ABI39_0_0RNSVGVBMOS.h"
#import "ABI39_0_0RNSVGUnits.h"
#import "ABI39_0_0RNSVGLength.h"
#import "ABI39_0_0RNSVGPathParser.h"

@class ABI39_0_0RNSVGBrush;

@interface ABI39_0_0RCTConvert (ABI39_0_0RNSVG)

+ (ABI39_0_0RNSVGLength*)ABI39_0_0RNSVGLength:(id)json;
+ (NSArray<ABI39_0_0RNSVGLength *>*)ABI39_0_0RNSVGLengthArray:(id)json;
+ (ABI39_0_0RNSVGCGFCRule)ABI39_0_0RNSVGCGFCRule:(id)json;
+ (ABI39_0_0RNSVGVBMOS)ABI39_0_0RNSVGVBMOS:(id)json;
+ (ABI39_0_0RNSVGUnits)ABI39_0_0RNSVGUnits:(id)json;
+ (ABI39_0_0RNSVGBrush *)ABI39_0_0RNSVGBrush:(id)json;
+ (ABI39_0_0RNSVGPathParser *)ABI39_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI39_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI39_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI39_0_0RNSVGCGGradient:(id)json;

@end
