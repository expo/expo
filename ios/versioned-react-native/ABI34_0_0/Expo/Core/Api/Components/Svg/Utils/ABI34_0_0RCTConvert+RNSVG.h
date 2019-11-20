/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI34_0_0RCTConvert+RNSVG.h"
#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>
#import "ABI34_0_0RNSVGCGFCRule.h"
#import "ABI34_0_0RNSVGVBMOS.h"
#import "ABI34_0_0RNSVGUnits.h"
#import "ABI34_0_0RNSVGLength.h"
#import "ABI34_0_0RNSVGPathParser.h"

@class ABI34_0_0RNSVGBrush;

@interface ABI34_0_0RCTConvert (ABI34_0_0RNSVG)

+ (ABI34_0_0RNSVGLength*)ABI34_0_0RNSVGLength:(id)json;
+ (NSArray<ABI34_0_0RNSVGLength *>*)ABI34_0_0RNSVGLengthArray:(id)json;
+ (ABI34_0_0RNSVGCGFCRule)ABI34_0_0RNSVGCGFCRule:(id)json;
+ (ABI34_0_0RNSVGVBMOS)ABI34_0_0RNSVGVBMOS:(id)json;
+ (ABI34_0_0RNSVGUnits)ABI34_0_0RNSVGUnits:(id)json;
+ (ABI34_0_0RNSVGBrush *)ABI34_0_0RNSVGBrush:(id)json;
+ (ABI34_0_0RNSVGPathParser *)ABI34_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI34_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI34_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI34_0_0RNSVGCGGradient:(id)json;

@end
