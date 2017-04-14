/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import "ABI16_0_0RCTConvert+RNSVG.h"
#import "ABI16_0_0RNSVGCGFloatArray.h"
#import "ABI16_0_0RNSVGTextFrame.h"
#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>
#import "ABI16_0_0RNSVGCGFCRule.h"

@class ABI16_0_0RNSVGBrush;

@interface ABI16_0_0RCTConvert (ABI16_0_0RNSVG)

+ (CGPathRef)CGPath:(id)json;
+ (CTTextAlignment)CTTextAlignment:(id)json;
+ (ABI16_0_0RNSVGCGFCRule)ABI16_0_0RNSVGCGFCRule:(id)json;
+ (ABI16_0_0RNSVGTextFrame)ABI16_0_0RNSVGTextFrame:(id)json;
+ (ABI16_0_0RNSVGCGFloatArray)ABI16_0_0RNSVGCGFloatArray:(id)json;
+ (ABI16_0_0RNSVGBrush *)ABI16_0_0RNSVGBrush:(id)json;

+ (NSArray *)ABI16_0_0RNSVGBezier:(id)json;
+ (CGRect)CGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)CGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)CGGradient:(id)json offset:(NSUInteger)offset;

@end
