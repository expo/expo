/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI41_0_0RNSVGRadialGradient.h"

@implementation ABI41_0_0RNSVGRadialGradient

- (instancetype)init
{
    if (self = [super init]) {
        _gradientTransform = CGAffineTransformIdentity;
    }
    return self;
}

- (void)setFx:(ABI41_0_0RNSVGLength *)fx
{
    if ([fx isEqualTo:_fx]) {
        return;
    }

    _fx = fx;
    [self invalidate];
}

- (void)setFy:(ABI41_0_0RNSVGLength *)fy
{
    if ([fy isEqualTo:_fy]) {
        return;
    }

    _fy = fy;
    [self invalidate];
}

- (void)setRx:(ABI41_0_0RNSVGLength *)rx
{
    if ([rx isEqualTo:_rx]) {
        return;
    }

    _rx = rx;
    [self invalidate];
}

- (void)setRy:(ABI41_0_0RNSVGLength *)ry
{
    if ([ry isEqualTo:_ry]) {
        return;
    }

    _ry = ry;
    [self invalidate];
}

- (void)setCx:(ABI41_0_0RNSVGLength *)cx
{
    if ([cx isEqualTo:_cx]) {
        return;
    }

    _cx = cx;
    [self invalidate];
}

- (void)setCy:(ABI41_0_0RNSVGLength *)cy
{
    if ([cy isEqualTo:_cy]) {
        return;
    }

    _cy = cy;
    [self invalidate];
}

- (void)setGradient:(NSArray<NSNumber *> *)gradient
{
    if (gradient == _gradient) {
        return;
    }

    _gradient = gradient;
    [self invalidate];
}

- (void)setGradientUnits:(ABI41_0_0RNSVGUnits)gradientUnits
{
    if (gradientUnits == _gradientUnits) {
        return;
    }

    _gradientUnits = gradientUnits;
    [self invalidate];
}

- (void)setGradientTransform:(CGAffineTransform)gradientTransform
{
    _gradientTransform = gradientTransform;
    [self invalidate];
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

- (void)parseReference
{
    self.dirty = false;
    NSArray<ABI41_0_0RNSVGLength *> *points = @[self.fx, self.fy, self.rx, self.ry, self.cx, self.cy];
    ABI41_0_0RNSVGPainter *painter = [[ABI41_0_0RNSVGPainter alloc] initWithPointsArray:points];
    [painter setUnits:self.gradientUnits];
    [painter setTransform:self.gradientTransform];
    [painter setRadialGradientColors:self.gradient];

    if (self.gradientUnits == kRNSVGUnitsUserSpaceOnUse) {
        [painter setUserSpaceBoundingBox:[self.svgView getContextBounds]];
    }

    [self.svgView definePainter:painter painterName:self.name];
}

@end

