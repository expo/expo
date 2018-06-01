/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>

#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>

#import "ABI28_0_0ARTBrush.h"
#import "ABI28_0_0ARTCGFloatArray.h"
#import "ABI28_0_0ARTTextFrame.h"

@interface ABI28_0_0RCTConvert (ABI28_0_0ART)

+ (CGPathRef)CGPath:(id)json;
+ (CTTextAlignment)CTTextAlignment:(id)json;
+ (ABI28_0_0ARTTextFrame)ABI28_0_0ARTTextFrame:(id)json;
+ (ABI28_0_0ARTCGFloatArray)ABI28_0_0ARTCGFloatArray:(id)json;
+ (ABI28_0_0ARTBrush *)ABI28_0_0ARTBrush:(id)json;

+ (CGPoint)CGPoint:(id)json offset:(NSUInteger)offset;
+ (CGRect)CGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)CGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)CGGradient:(id)json offset:(NSUInteger)offset;

@end
