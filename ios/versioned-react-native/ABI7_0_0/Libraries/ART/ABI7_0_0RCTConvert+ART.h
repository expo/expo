/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <QuartzCore/QuartzCore.h>

#import "ABI7_0_0ARTBrush.h"
#import "ABI7_0_0ARTCGFloatArray.h"
#import "ABI7_0_0ARTTextFrame.h"
#import "ABI7_0_0RCTConvert.h"

@interface ABI7_0_0RCTConvert (ABI7_0_0ART)

+ (CGPathRef)CGPath:(id)json;
+ (CTTextAlignment)CTTextAlignment:(id)json;
+ (ABI7_0_0ARTTextFrame)ABI7_0_0ARTTextFrame:(id)json;
+ (ABI7_0_0ARTCGFloatArray)ABI7_0_0ARTCGFloatArray:(id)json;
+ (ABI7_0_0ARTBrush *)ABI7_0_0ARTBrush:(id)json;

+ (CGPoint)CGPoint:(id)json offset:(NSUInteger)offset;
+ (CGRect)CGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)CGColor:(id)json offset:(NSUInteger)offset;
+ (CGGradientRef)CGGradient:(id)json offset:(NSUInteger)offset;

@end
