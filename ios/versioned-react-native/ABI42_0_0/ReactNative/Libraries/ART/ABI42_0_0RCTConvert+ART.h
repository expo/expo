/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>

#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>

#import "ABI42_0_0ARTBrush.h"
#import "ABI42_0_0ARTCGFloatArray.h"
#import "ABI42_0_0ARTTextFrame.h"

@interface ABI42_0_0RCTConvert (ABI42_0_0ART)

+ (CGPathRef)CGPath:(id)json CF_RETURNS_NOT_RETAINED;
+ (CTTextAlignment)CTTextAlignment:(id)json;
+ (ABI42_0_0ARTTextFrame)ABI42_0_0ARTTextFrame:(id)json;
+ (ABI42_0_0ARTCGFloatArray)ABI42_0_0ARTCGFloatArray:(id)json;
+ (ABI42_0_0ARTBrush *)ABI42_0_0ARTBrush:(id)json;

+ (CGPoint)CGPoint:(id)json offset:(NSUInteger)offset;
+ (CGRect)CGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)CGColor:(id)json offset:(NSUInteger)offset CF_RETURNS_NOT_RETAINED;
+ (CGGradientRef)CGGradient:(id)json offset:(NSUInteger)offset CF_RETURNS_NOT_RETAINED;

@end
