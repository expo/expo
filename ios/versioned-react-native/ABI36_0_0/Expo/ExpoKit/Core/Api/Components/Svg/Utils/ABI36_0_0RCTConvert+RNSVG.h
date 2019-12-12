/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI36_0_0RCTConvert+RNSVG.h"
#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>
#import "ABI36_0_0RNSVGCGFCRule.h"
#import "ABI36_0_0RNSVGVBMOS.h"
#import "ABI36_0_0RNSVGUnits.h"
#import "ABI36_0_0RNSVGLength.h"
#import "ABI36_0_0RNSVGPathParser.h"

@class ABI36_0_0RNSVGBrush;

@interface ABI36_0_0RCTConvert (ABI36_0_0RNSVG)

+ (ABI36_0_0RNSVGLength*)ABI36_0_0RNSVGLength:(id)json;
+ (NSArray<ABI36_0_0RNSVGLength *>*)ABI36_0_0RNSVGLengthArray:(id)json;
+ (ABI36_0_0RNSVGCGFCRule)ABI36_0_0RNSVGCGFCRule:(id)json;
+ (ABI36_0_0RNSVGVBMOS)ABI36_0_0RNSVGVBMOS:(id)json;
+ (ABI36_0_0RNSVGUnits)ABI36_0_0RNSVGUnits:(id)json;
+ (ABI36_0_0RNSVGBrush *)ABI36_0_0RNSVGBrush:(id)json;
+ (ABI36_0_0RNSVGPathParser *)ABI36_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI36_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI36_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI36_0_0RNSVGCGGradient:(id)json;

@end
