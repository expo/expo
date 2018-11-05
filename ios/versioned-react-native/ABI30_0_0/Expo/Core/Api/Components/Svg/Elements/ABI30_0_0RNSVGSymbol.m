/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI30_0_0RNSVGSymbol.h"
#import "ABI30_0_0RNSVGViewBox.h"

@class ABI30_0_0RNSVGNode;

@implementation ABI30_0_0RNSVGSymbol

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

- (void)setMeetOrSlice:(ABI30_0_0RNSVGVBMOS)meetOrSlice
{
    if (meetOrSlice == _meetOrSlice) {
        return;
    }
    
    [self invalidate];
    _meetOrSlice = meetOrSlice;
}

- (void)renderTo:(CGContextRef)context
{
    // Do not render Symbol
}

- (void)renderSymbolTo:(CGContextRef)context width:(CGFloat)width height:(CGFloat)height
{
    if (self.align) {
        CGRect eRect = CGRectMake(0, 0, width, height);
        
        CGAffineTransform viewBoxTransform = [ABI30_0_0RNSVGViewBox getTransform:CGRectMake(self.minX, self.minY, self.vbWidth, self.vbHeight)
                                                                  eRect:eRect
                                                                  align:self.align
                                                            meetOrSlice:self.meetOrSlice];
        
        CGContextConcatCTM(context, viewBoxTransform);
    }
    [self renderGroupTo:context];
}

@end

