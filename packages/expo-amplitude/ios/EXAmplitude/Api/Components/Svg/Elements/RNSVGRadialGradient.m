/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGRadialGradient.h"

@implementation RNSVGRadialGradient

- (void)setFx:(RNSVGLength *)fx
{
    if ([fx isEqualTo:_fx]) {
        return;
    }
    
    _fx = fx;
    [self invalidate];
}

- (void)setFy:(RNSVGLength *)fy
{
    if ([fy isEqualTo:_fy]) {
        return;
    }
    
    _fy = fy;
    [self invalidate];
}

- (void)setRx:(RNSVGLength *)rx
{
    if ([rx isEqualTo:_rx]) {
        return;
    }
    
    _rx = rx;
    [self invalidate];
}

- (void)setRy:(RNSVGLength *)ry
{
    if ([ry isEqualTo:_ry]) {
        return;
    }
    
    _ry = ry;
    [self invalidate];
}

- (void)setCx:(RNSVGLength *)cx
{
    if ([cx isEqualTo:_cx]) {
        return;
    }
    
    _cx = cx;
    [self invalidate];
}

- (void)setCy:(RNSVGLength *)cy
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

- (void)setGradientUnits:(RNSVGUnits)gradientUnits
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
    NSArray<RNSVGLength *> *points = @[self.fx, self.fy, self.rx, self.ry, self.cx, self.cy];
    RNSVGPainter *painter = [[RNSVGPainter alloc] initWithPointsArray:points];
    [painter setUnits:self.gradientUnits];
    [painter setTransform:self.gradientTransform];
    [painter setRadialGradientColors:self.gradient];
    
    if (self.gradientUnits == kRNSVGUnitsUserSpaceOnUse) {
        [painter setUserSpaceBoundingBox:[self.svgView getContextBounds]];
    }
    
    [self.svgView definePainter:painter painterName:self.name];
}

@end

