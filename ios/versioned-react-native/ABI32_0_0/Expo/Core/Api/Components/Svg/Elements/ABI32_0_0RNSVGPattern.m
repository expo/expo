/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI32_0_0RNSVGPattern.h"
#import "ABI32_0_0RNSVGPainter.h"
#import "ABI32_0_0RNSVGBrushType.h"
#import "ABI32_0_0RNSVGNode.h"

@implementation ABI32_0_0RNSVGPattern

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

- (void)parseReference
{
    NSArray<ABI32_0_0RNSVGLength *> *points = @[self.x, self.y, self.patternwidth, self.patternheight];
    ABI32_0_0RNSVGPainter *painter = [[ABI32_0_0RNSVGPainter alloc] initWithPointsArray:points];
    [painter setUnits:self.patternUnits];
    [painter setContentUnits:self.patternContentUnits];
    [painter setTransform:self.patternTransform];
    [painter setPattern:self];
    
    if (self.patternUnits == kRNSVGUnitsUserSpaceOnUse || self.patternContentUnits == kRNSVGUnitsUserSpaceOnUse) {
        [painter setUserSpaceBoundingBox:[self.svgView getContextBounds]];
    }
    
    [self.svgView definePainter:painter painterName:self.name];
}

- (void)setX:(ABI32_0_0RNSVGLength *)x
{
    if ([x isEqualTo:_x]) {
        return;
    }
    
    _x = x;
    [self invalidate];
}

- (void)setY:(ABI32_0_0RNSVGLength *)y
{
    if ([y isEqualTo:_y]) {
        return;
    }
    
    _y = y;
    [self invalidate];
}

- (void)setPatternwidth:(ABI32_0_0RNSVGLength *)patternwidth
{
    if ([patternwidth isEqualTo:_patternwidth]) {
        return;
    }
    
    _patternwidth = patternwidth;
    [self invalidate];
}

- (void)setPatternheight:(ABI32_0_0RNSVGLength *)patternheight
{
    if ([patternheight isEqualTo:_patternheight]) {
        return;
    }
    
    _patternheight = patternheight;
    [self invalidate];
}

- (void)setPatternUnits:(ABI32_0_0RNSVGUnits)patternUnits
{
    if (patternUnits == _patternUnits) {
        return;
    }
    
    _patternUnits = patternUnits;
    [self invalidate];
}

- (void)setPatternContentUnits:(ABI32_0_0RNSVGUnits)patternContentUnits
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

- (void)setMeetOrSlice:(ABI32_0_0RNSVGVBMOS)meetOrSlice
{
    if (meetOrSlice == _meetOrSlice) {
        return;
    }
    
    [self invalidate];
    _meetOrSlice = meetOrSlice;
}

@end

