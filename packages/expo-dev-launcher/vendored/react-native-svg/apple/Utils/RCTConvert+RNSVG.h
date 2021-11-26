/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "RCTConvert+RNSVG.h"
#import <React/RCTConvert.h>
#import "RNSVGCGFCRule.h"
#import "RNSVGVBMOS.h"
#import "RNSVGUnits.h"
#import "RNSVGLength.h"
#import "RNSVGPathParser.h"

@class RNSVGBrush;

@interface RCTConvert (RNSVG)

+ (RNSVGLength*)RNSVGLength:(id)json;
+ (NSArray<RNSVGLength *>*)RNSVGLengthArray:(id)json;
+ (RNSVGCGFCRule)RNSVGCGFCRule:(id)json;
+ (RNSVGVBMOS)RNSVGVBMOS:(id)json;
+ (RNSVGUnits)RNSVGUnits:(id)json;
+ (RNSVGBrush *)RNSVGBrush:(id)json;
+ (RNSVGPathParser *)RNSVGCGPath:(NSString *)d;
+ (CGRect)RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)RNSVGCGGradient:(id)json;

@end
