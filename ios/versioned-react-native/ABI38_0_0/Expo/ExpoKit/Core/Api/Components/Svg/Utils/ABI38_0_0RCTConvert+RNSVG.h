/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI38_0_0RCTConvert+RNSVG.h"
#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import "ABI38_0_0RNSVGCGFCRule.h"
#import "ABI38_0_0RNSVGVBMOS.h"
#import "ABI38_0_0RNSVGUnits.h"
#import "ABI38_0_0RNSVGLength.h"
#import "ABI38_0_0RNSVGPathParser.h"

@class ABI38_0_0RNSVGBrush;

@interface ABI38_0_0RCTConvert (ABI38_0_0RNSVG)

+ (ABI38_0_0RNSVGLength*)ABI38_0_0RNSVGLength:(id)json;
+ (NSArray<ABI38_0_0RNSVGLength *>*)ABI38_0_0RNSVGLengthArray:(id)json;
+ (ABI38_0_0RNSVGCGFCRule)ABI38_0_0RNSVGCGFCRule:(id)json;
+ (ABI38_0_0RNSVGVBMOS)ABI38_0_0RNSVGVBMOS:(id)json;
+ (ABI38_0_0RNSVGUnits)ABI38_0_0RNSVGUnits:(id)json;
+ (ABI38_0_0RNSVGBrush *)ABI38_0_0RNSVGBrush:(id)json;
+ (ABI38_0_0RNSVGPathParser *)ABI38_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI38_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI38_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI38_0_0RNSVGCGGradient:(id)json;

@end
