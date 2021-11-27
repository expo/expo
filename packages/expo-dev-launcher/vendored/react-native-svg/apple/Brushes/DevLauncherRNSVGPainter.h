/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConvert+DevLauncherRNSVG.h"
#import "DevLauncherRNSVGBrushType.h"
#import "DevLauncherRNSVGUnits.h"
#import "DevLauncherRNSVGLength.h"

@class DevLauncherRNSVGPattern;

@interface DevLauncherRNSVGPainter : NSObject

@property (nonatomic, assign) DevLauncherRNSVGPattern* pattern;
@property (nonatomic, assign) CGRect paintBounds;
@property (nonatomic, assign) bool useObjectBoundingBoxForContentUnits;
@property (nonatomic, assign) CGRect bounds;

- (instancetype)initWithPointsArray:(NSArray<DevLauncherRNSVGLength *> *)pointsArray NS_DESIGNATED_INITIALIZER;

- (void)paint:(CGContextRef)context bounds:(CGRect)bounds;

- (void)setUnits:(DevLauncherRNSVGUnits)unit;

- (void)setContentUnits:(DevLauncherRNSVGUnits)unit;

- (void)setUserSpaceBoundingBox:(CGRect)userSpaceBoundingBox;

- (void)setTransform:(CGAffineTransform)transform;

- (void)setLinearGradientColors:(NSArray<NSNumber *> *)colors;

- (void)setRadialGradientColors:(NSArray<NSNumber *> *)colors;

@end
