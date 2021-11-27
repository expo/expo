/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "DevLauncherRNSVGLinearGradient.h"
#import "DevLauncherRNSVGPainter.h"
#import "DevLauncherRNSVGBrushType.h"

@implementation DevLauncherRNSVGLinearGradient

- (instancetype)init
{
    if (self = [super init]) {
        _gradientTransform = CGAffineTransformIdentity;
    }
    return self;
}

- (void)setX1:(DevLauncherRNSVGLength *)x1
{
    if ([x1 isEqualTo:_x1]) {
        return;
    }

    _x1 = x1;
    [self invalidate];
}

- (void)setY1:(DevLauncherRNSVGLength *)y1
{
    if ([y1 isEqualTo:_y1]) {
        return;
    }

    _y1 = y1;
    [self invalidate];
}

- (void)setX2:(DevLauncherRNSVGLength *)x2
{
    if ([x2 isEqualTo:_x2]) {
        return;
    }

    _x2 = x2;
    [self invalidate];
}

- (void)setY2:(DevLauncherRNSVGLength *)y2
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

- (void)setGradientUnits:(DevLauncherRNSVGUnits)gradientUnits
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

- (DevLauncherRNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

- (void)parseReference
{
    self.dirty = false;
    NSArray<DevLauncherRNSVGLength *> *points = @[self.x1, self.y1, self.x2, self.y2];
    DevLauncherRNSVGPainter *painter = [[DevLauncherRNSVGPainter alloc] initWithPointsArray:points];
    [painter setUnits:self.gradientUnits];
    [painter setTransform:self.gradientTransform];
    [painter setLinearGradientColors:self.gradient];

    if (self.gradientUnits == kDevLauncherRNSVGUnitsUserSpaceOnUse) {
        [painter setUserSpaceBoundingBox:[self.svgView getContextBounds]];
    }

    [self.svgView definePainter:painter painterName:self.name];
}
@end

