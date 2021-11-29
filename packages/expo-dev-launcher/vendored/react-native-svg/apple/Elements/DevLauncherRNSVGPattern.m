/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "DevLauncherRNSVGPattern.h"
#import "DevLauncherRNSVGPainter.h"
#import "DevLauncherRNSVGBrushType.h"
#import "DevLauncherRNSVGNode.h"

@implementation DevLauncherRNSVGPattern

- (instancetype)init
{
    if (self = [super init]) {
        _patternTransform = CGAffineTransformIdentity;
    }
    return self;
}

- (DevLauncherRNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

- (void)parseReference
{
    self.dirty = false;
    NSArray<DevLauncherRNSVGLength *> *points = @[self.x, self.y, self.patternwidth, self.patternheight];
    DevLauncherRNSVGPainter *painter = [[DevLauncherRNSVGPainter alloc] initWithPointsArray:points];
    [painter setUnits:self.patternUnits];
    [painter setContentUnits:self.patternContentUnits];
    [painter setTransform:self.patternTransform];
    [painter setPattern:self];

    if (self.patternUnits == kDevLauncherRNSVGUnitsUserSpaceOnUse || self.patternContentUnits == kDevLauncherRNSVGUnitsUserSpaceOnUse) {
        [painter setUserSpaceBoundingBox:[self.svgView getContextBounds]];
    }

    [self.svgView definePainter:painter painterName:self.name];
}

- (void)setX:(DevLauncherRNSVGLength *)x
{
    if ([x isEqualTo:_x]) {
        return;
    }

    _x = x;
    [self invalidate];
}

- (void)setY:(DevLauncherRNSVGLength *)y
{
    if ([y isEqualTo:_y]) {
        return;
    }

    _y = y;
    [self invalidate];
}

- (void)setPatternwidth:(DevLauncherRNSVGLength *)patternwidth
{
    if ([patternwidth isEqualTo:_patternwidth]) {
        return;
    }

    _patternwidth = patternwidth;
    [self invalidate];
}

- (void)setPatternheight:(DevLauncherRNSVGLength *)patternheight
{
    if ([patternheight isEqualTo:_patternheight]) {
        return;
    }

    _patternheight = patternheight;
    [self invalidate];
}

- (void)setPatternUnits:(DevLauncherRNSVGUnits)patternUnits
{
    if (patternUnits == _patternUnits) {
        return;
    }

    _patternUnits = patternUnits;
    [self invalidate];
}

- (void)setPatternContentUnits:(DevLauncherRNSVGUnits)patternContentUnits
{
    if (patternContentUnits == _patternContentUnits) {
        return;
    }

    _patternContentUnits = patternContentUnits;
    [self invalidate];
}

- (void)setPatternTransform:(CGAffineTransform)patternTransform
{
    _patternTransform = patternTransform;
    [self invalidate];
}

- (void)setMinX:(CGFloat)minX
{
    if (minX == _minX) {
        return;
    }

    [self invalidate];
    _minX = minX;
}

- (void)setMinY:(CGFloat)minY
{
    if (minY == _minY) {
        return;
    }

    [self invalidate];
    _minY = minY;
}

- (void)setVbWidth:(CGFloat)vbWidth
{
    if (vbWidth == _vbWidth) {
        return;
    }

    [self invalidate];
    _vbWidth = vbWidth;
}

- (void)setVbHeight:(CGFloat)vbHeight
{
    if (_vbHeight == vbHeight) {
        return;
    }

    [self invalidate];
    _vbHeight = vbHeight;
}

- (void)setAlign:(NSString *)align
{
    if ([align isEqualToString:_align]) {
        return;
    }

    [self invalidate];
    _align = align;
}

- (void)setMeetOrSlice:(DevLauncherRNSVGVBMOS)meetOrSlice
{
    if (meetOrSlice == _meetOrSlice) {
        return;
    }

    [self invalidate];
    _meetOrSlice = meetOrSlice;
}

@end

