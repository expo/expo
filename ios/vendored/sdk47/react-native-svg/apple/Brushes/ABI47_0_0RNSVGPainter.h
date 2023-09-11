/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTConvert+RNSVG.h"
#import "ABI47_0_0RNSVGBrushType.h"
#import "ABI47_0_0RNSVGLength.h"
#import "ABI47_0_0RNSVGUnits.h"

@class ABI47_0_0RNSVGPattern;

@interface ABI47_0_0RNSVGPainter : NSObject

@property (nonatomic, assign) ABI47_0_0RNSVGPattern *pattern;
@property (nonatomic, assign) CGRect paintBounds;
@property (nonatomic, assign) bool useObjectBoundingBoxForContentUnits;
@property (nonatomic, assign) CGRect bounds;

- (instancetype)initWithPointsArray:(NSArray<ABI47_0_0RNSVGLength *> *)pointsArray NS_DESIGNATED_INITIALIZER;

- (void)paint:(CGContextRef)context bounds:(CGRect)bounds;

- (void)setUnits:(ABI47_0_0RNSVGUnits)unit;

- (void)setContentUnits:(ABI47_0_0RNSVGUnits)unit;

- (void)setUserSpaceBoundingBox:(CGRect)userSpaceBoundingBox;

- (void)setTransform:(CGAffineTransform)transform;

- (void)setLinearGradientColors:(NSArray<NSNumber *> *)colors;

- (void)setRadialGradientColors:(NSArray<NSNumber *> *)colors;

@end
