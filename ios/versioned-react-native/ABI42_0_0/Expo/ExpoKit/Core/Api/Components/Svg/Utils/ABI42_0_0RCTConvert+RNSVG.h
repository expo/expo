/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI42_0_0RCTConvert+RNSVG.h"
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import "ABI42_0_0RNSVGCGFCRule.h"
#import "ABI42_0_0RNSVGVBMOS.h"
#import "ABI42_0_0RNSVGUnits.h"
#import "ABI42_0_0RNSVGLength.h"
#import "ABI42_0_0RNSVGPathParser.h"

@class ABI42_0_0RNSVGBrush;

@interface ABI42_0_0RCTConvert (ABI42_0_0RNSVG)

+ (ABI42_0_0RNSVGLength*)ABI42_0_0RNSVGLength:(id)json;
+ (NSArray<ABI42_0_0RNSVGLength *>*)ABI42_0_0RNSVGLengthArray:(id)json;
+ (ABI42_0_0RNSVGCGFCRule)ABI42_0_0RNSVGCGFCRule:(id)json;
+ (ABI42_0_0RNSVGVBMOS)ABI42_0_0RNSVGVBMOS:(id)json;
+ (ABI42_0_0RNSVGUnits)ABI42_0_0RNSVGUnits:(id)json;
+ (ABI42_0_0RNSVGBrush *)ABI42_0_0RNSVGBrush:(id)json;
+ (ABI42_0_0RNSVGPathParser *)ABI42_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI42_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI42_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI42_0_0RNSVGCGGradient:(id)json;

@end
