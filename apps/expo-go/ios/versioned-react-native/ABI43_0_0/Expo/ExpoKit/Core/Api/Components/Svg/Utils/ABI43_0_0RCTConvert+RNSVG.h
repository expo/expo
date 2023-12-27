/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI43_0_0RCTConvert+RNSVG.h"
#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import "ABI43_0_0RNSVGCGFCRule.h"
#import "ABI43_0_0RNSVGVBMOS.h"
#import "ABI43_0_0RNSVGUnits.h"
#import "ABI43_0_0RNSVGLength.h"
#import "ABI43_0_0RNSVGPathParser.h"

@class ABI43_0_0RNSVGBrush;

@interface ABI43_0_0RCTConvert (ABI43_0_0RNSVG)

+ (ABI43_0_0RNSVGLength*)ABI43_0_0RNSVGLength:(id)json;
+ (NSArray<ABI43_0_0RNSVGLength *>*)ABI43_0_0RNSVGLengthArray:(id)json;
+ (ABI43_0_0RNSVGCGFCRule)ABI43_0_0RNSVGCGFCRule:(id)json;
+ (ABI43_0_0RNSVGVBMOS)ABI43_0_0RNSVGVBMOS:(id)json;
+ (ABI43_0_0RNSVGUnits)ABI43_0_0RNSVGUnits:(id)json;
+ (ABI43_0_0RNSVGBrush *)ABI43_0_0RNSVGBrush:(id)json;
+ (ABI43_0_0RNSVGPathParser *)ABI43_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI43_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI43_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI43_0_0RNSVGCGGradient:(id)json;

@end
