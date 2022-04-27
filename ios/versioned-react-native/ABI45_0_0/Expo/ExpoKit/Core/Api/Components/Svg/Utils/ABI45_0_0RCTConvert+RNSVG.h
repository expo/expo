/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI45_0_0RCTConvert+RNSVG.h"
#import <ABI45_0_0React/ABI45_0_0RCTConvert.h>
#import "ABI45_0_0RNSVGCGFCRule.h"
#import "ABI45_0_0RNSVGVBMOS.h"
#import "ABI45_0_0RNSVGUnits.h"
#import "ABI45_0_0RNSVGLength.h"
#import "ABI45_0_0RNSVGPathParser.h"

@class ABI45_0_0RNSVGBrush;

@interface ABI45_0_0RCTConvert (ABI45_0_0RNSVG)

+ (ABI45_0_0RNSVGLength*)ABI45_0_0RNSVGLength:(id)json;
+ (NSArray<ABI45_0_0RNSVGLength *>*)ABI45_0_0RNSVGLengthArray:(id)json;
+ (ABI45_0_0RNSVGCGFCRule)ABI45_0_0RNSVGCGFCRule:(id)json;
+ (ABI45_0_0RNSVGVBMOS)ABI45_0_0RNSVGVBMOS:(id)json;
+ (ABI45_0_0RNSVGUnits)ABI45_0_0RNSVGUnits:(id)json;
+ (ABI45_0_0RNSVGBrush *)ABI45_0_0RNSVGBrush:(id)json;
+ (ABI45_0_0RNSVGPathParser *)ABI45_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI45_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (ABI45_0_0RNSVGColor *)ABI45_0_0RNSVGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI45_0_0RNSVGCGGradient:(id)json;

@end
