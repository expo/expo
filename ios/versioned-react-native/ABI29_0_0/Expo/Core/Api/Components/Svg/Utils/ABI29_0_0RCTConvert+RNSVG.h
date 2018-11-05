/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI29_0_0RCTConvert+RNSVG.h"
#import "ABI29_0_0RNSVGCGFloatArray.h"
#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>
#import "ABI29_0_0RNSVGCGFCRule.h"
#import "ABI29_0_0RNSVGVBMOS.h"
#import "ABI29_0_0RNSVGUnits.h"
#import "ABI29_0_0RNSVGPathParser.h"

@class ABI29_0_0RNSVGBrush;

@interface ABI29_0_0RCTConvert (ABI29_0_0RNSVG)

+ (ABI29_0_0RNSVGCGFCRule)ABI29_0_0RNSVGCGFCRule:(id)json;
+ (ABI29_0_0RNSVGVBMOS)ABI29_0_0RNSVGVBMOS:(id)json;
+ (ABI29_0_0RNSVGUnits)ABI29_0_0RNSVGUnits:(id)json;
+ (ABI29_0_0RNSVGCGFloatArray)ABI29_0_0RNSVGCGFloatArray:(id)json;
+ (ABI29_0_0RNSVGBrush *)ABI29_0_0RNSVGBrush:(id)json;
+ (ABI29_0_0RNSVGPathParser *)ABI29_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI29_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI29_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI29_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
