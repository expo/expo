/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "DevLauncherRNSVGMask.h"
#import "DevLauncherRNSVGPainter.h"
#import "DevLauncherRNSVGBrushType.h"
#import "DevLauncherRNSVGNode.h"

@implementation DevLauncherRNSVGMask

- (DevLauncherRNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

- (void)parseReference
{
    self.dirty = false;
    [self.svgView defineMask:self maskName:self.name];
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

- (void)setMaskwidth:(DevLauncherRNSVGLength *)maskwidth
{
    if ([maskwidth isEqualTo:_maskwidth]) {
        return;
    }
    
    _maskwidth = maskwidth;
    [self invalidate];
}

- (void)setMaskheight:(DevLauncherRNSVGLength *)maskheight
{
    if ([maskheight isEqualTo:_maskheight]) {
        return;
    }
    
    _maskheight = maskheight;
    [self invalidate];
}

- (void)setMaskUnits:(DevLauncherRNSVGUnits)maskUnits
{
    if (maskUnits == _maskUnits) {
        return;
    }
    
    _maskUnits = maskUnits;
    [self invalidate];
}

- (void)setMaskContentUnits:(DevLauncherRNSVGUnits)maskContentUnits
{
    if (maskContentUnits == _maskContentUnits) {
        return;
    }
    
    _maskContentUnits = maskContentUnits;
    [self invalidate];
}

- (void)setMaskTransform:(CGAffineTransform)maskTransform
{
    _maskTransform = maskTransform;
    [self invalidate];
}

@end

