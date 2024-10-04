/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI42_0_0RNSVGLinearGradient.h"
#import "ABI42_0_0RNSVGPainter.h"
#import "ABI42_0_0RNSVGBrushType.h"

@implementation ABI42_0_0RNSVGLinearGradient

- (instancetype)init
{
    if (self = [super init]) {
        _gradientTransform = CGAffineTransformIdentity;
    }
    return self;
}

- (void)setX1:(ABI42_0_0RNSVGLength *)x1
{
    if ([x1 isEqualTo:_x1]) {
        return;
    }

    _x1 = x1;
    [self invalidate];
}

- (void)setY1:(ABI42_0_0RNSVGLength *)y1
{
    if ([y1 isEqualTo:_y1]) {
        return;
    }

    _y1 = y1;
    [self invalidate];
}

- (void)setX2:(ABI42_0_0RNSVGLength *)x2
{
    if ([x2 isEqualTo:_x2]) {
        return;
    }

    _x2 = x2;
    [self invalidate];
}

- (void)setY2:(ABI42_0_0RNSVGLength *)y2
{
    if ([y2 isEqualTo:_y2]) {
        return;
    }

    _y2 = y2;
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

- (void)setGradientUnits:(ABI42_0_0RNSVGUnits)gradientUnits
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

- (ABI42_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

- (void)parseReference
{
    self.dirty = false;
    NSArray<ABI42_0_0RNSVGLength *> *points = @[self.x1, self.y1, self.x2, self.y2];
    ABI42_0_0RNSVGPainter *painter = [[ABI42_0_0RNSVGPainter alloc] initWithPointsArray:points];
    [painter setUnits:self.gradientUnits];
    [painter setTransform:self.gradientTransform];
    [painter setLinearGradientColors:self.gradient];

    if (self.gradientUnits == kRNSVGUnitsUserSpaceOnUse) {
        [painter setUserSpaceBoundingBox:[self.svgView getContextBounds]];
    }

    [self.svgView definePainter:painter painterName:self.name];
}
@end

