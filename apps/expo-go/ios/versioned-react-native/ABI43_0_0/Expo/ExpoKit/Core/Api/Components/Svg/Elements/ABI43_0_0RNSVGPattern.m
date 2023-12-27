/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI43_0_0RNSVGPattern.h"
#import "ABI43_0_0RNSVGPainter.h"
#import "ABI43_0_0RNSVGBrushType.h"
#import "ABI43_0_0RNSVGNode.h"

@implementation ABI43_0_0RNSVGPattern

- (instancetype)init
{
    if (self = [super init]) {
        _patternTransform = CGAffineTransformIdentity;
    }
    return self;
}

- (ABI43_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

- (void)parseReference
{
    self.dirty = false;
    NSArray<ABI43_0_0RNSVGLength *> *points = @[self.x, self.y, self.patternwidth, self.patternheight];
    ABI43_0_0RNSVGPainter *painter = [[ABI43_0_0RNSVGPainter alloc] initWithPointsArray:points];
    [painter setUnits:self.patternUnits];
    [painter setContentUnits:self.patternContentUnits];
    [painter setTransform:self.patternTransform];
    [painter setPattern:self];

    if (self.patternUnits == kRNSVGUnitsUserSpaceOnUse || self.patternContentUnits == kRNSVGUnitsUserSpaceOnUse) {
        [painter setUserSpaceBoundingBox:[self.svgView getContextBounds]];
    }

    [self.svgView definePainter:painter painterName:self.name];
}

- (void)setX:(ABI43_0_0RNSVGLength *)x
{
    if ([x isEqualTo:_x]) {
        return;
    }

    _x = x;
    [self invalidate];
}

- (void)setY:(ABI43_0_0RNSVGLength *)y
{
    if ([y isEqualTo:_y]) {
        return;
    }

    _y = y;
    [self invalidate];
}

- (void)setPatternwidth:(ABI43_0_0RNSVGLength *)patternwidth
{
    if ([patternwidth isEqualTo:_patternwidth]) {
        return;
    }

    _patternwidth = patternwidth;
    [self invalidate];
}

- (void)setPatternheight:(ABI43_0_0RNSVGLength *)patternheight
{
    if ([patternheight isEqualTo:_patternheight]) {
        return;
    }

    _patternheight = patternheight;
    [self invalidate];
}

- (void)setPatternUnits:(ABI43_0_0RNSVGUnits)patternUnits
{
    if (patternUnits == _patternUnits) {
        return;
    }

    _patternUnits = patternUnits;
    [self invalidate];
}

- (void)setPatternContentUnits:(ABI43_0_0RNSVGUnits)patternContentUnits
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

- (void)setMeetOrSlice:(ABI43_0_0RNSVGVBMOS)meetOrSlice
{
    if (meetOrSlice == _meetOrSlice) {
        return;
    }

    [self invalidate];
    _meetOrSlice = meetOrSlice;
}

@end

