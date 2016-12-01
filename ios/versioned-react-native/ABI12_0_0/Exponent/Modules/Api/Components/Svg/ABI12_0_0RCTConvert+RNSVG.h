/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import "ABI12_0_0RCTConvert+RNSVG.h"
#import "ABI12_0_0RNSVGCGFloatArray.h"
#import "ABI12_0_0RNSVGTextFrame.h"
#import "ABI12_0_0RCTConvert.h"
#import "ABI12_0_0RNSVGCGFCRule.h"

@class ABI12_0_0RNSVGBrush;

@interface ABI12_0_0RCTConvert (ABI12_0_0RNSVG)

+ (CGPathRef)CGPath:(id)json;
+ (CTTextAlignment)CTTextAlignment:(id)json;
+ (ABI12_0_0RNSVGCGFCRule)ABI12_0_0RNSVGCGFCRule:(id)json;
+ (ABI12_0_0RNSVGTextFrame)ABI12_0_0RNSVGTextFrame:(id)json;
+ (ABI12_0_0RNSVGCGFloatArray)ABI12_0_0RNSVGCGFloatArray:(id)json;
+ (ABI12_0_0RNSVGBrush *)ABI12_0_0RNSVGBrush:(id)json;

+ (NSArray *)ABI12_0_0RNSVGBezier:(id)json;
+ (CGRect)CGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)CGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)CGGradient:(id)json offset:(NSUInteger)offset;

@end
