/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI41_0_0RCTConvert+RNSVG.h"
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import "ABI41_0_0RNSVGCGFCRule.h"
#import "ABI41_0_0RNSVGVBMOS.h"
#import "ABI41_0_0RNSVGUnits.h"
#import "ABI41_0_0RNSVGLength.h"
#import "ABI41_0_0RNSVGPathParser.h"

@class ABI41_0_0RNSVGBrush;

@interface ABI41_0_0RCTConvert (ABI41_0_0RNSVG)

+ (ABI41_0_0RNSVGLength*)ABI41_0_0RNSVGLength:(id)json;
+ (NSArray<ABI41_0_0RNSVGLength *>*)ABI41_0_0RNSVGLengthArray:(id)json;
+ (ABI41_0_0RNSVGCGFCRule)ABI41_0_0RNSVGCGFCRule:(id)json;
+ (ABI41_0_0RNSVGVBMOS)ABI41_0_0RNSVGVBMOS:(id)json;
+ (ABI41_0_0RNSVGUnits)ABI41_0_0RNSVGUnits:(id)json;
+ (ABI41_0_0RNSVGBrush *)ABI41_0_0RNSVGBrush:(id)json;
+ (ABI41_0_0RNSVGPathParser *)ABI41_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI41_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI41_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI41_0_0RNSVGCGGradient:(id)json;

@end
