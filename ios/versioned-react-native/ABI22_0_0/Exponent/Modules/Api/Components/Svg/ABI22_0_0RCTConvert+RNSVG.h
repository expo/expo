/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>
#import <CoreText/CoreText.h>
#import "ABI22_0_0RCTConvert+RNSVG.h"
#import "ABI22_0_0RNSVGCGFloatArray.h"
#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>
#import "ABI22_0_0RNSVGCGFCRule.h"
#import "ABI22_0_0RNSVGVBMOS.h"
#import "ABI22_0_0RNSVGTextAnchor.h"
#import "ABI22_0_0RNSVGUnits.h"
#import "ABI22_0_0RNSVGPathParser.h"

@class ABI22_0_0RNSVGBrush;

@interface ABI22_0_0RCTConvert (ABI22_0_0RNSVG)

+ (ABI22_0_0RNSVGTextAnchor)ABI22_0_0RNSVGTextAnchor:(id)json;
+ (ABI22_0_0RNSVGCGFCRule)ABI22_0_0RNSVGCGFCRule:(id)json;
+ (ABI22_0_0RNSVGVBMOS)ABI22_0_0RNSVGVBMOS:(id)json;
+ (ABI22_0_0RNSVGUnits)ABI22_0_0RNSVGUnits:(id)json;
+ (ABI22_0_0RNSVGCGFloatArray)ABI22_0_0RNSVGCGFloatArray:(id)json;
+ (ABI22_0_0RNSVGBrush *)ABI22_0_0RNSVGBrush:(id)json;
+ (ABI22_0_0RNSVGPathParser *)ABI22_0_0RNSVGCGPath:(NSString *)d;
+ (CGRect)ABI22_0_0RNSVGCGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)ABI22_0_0RNSVGCGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)ABI22_0_0RNSVGCGGradient:(id)json offset:(NSUInteger)offset;

@end
