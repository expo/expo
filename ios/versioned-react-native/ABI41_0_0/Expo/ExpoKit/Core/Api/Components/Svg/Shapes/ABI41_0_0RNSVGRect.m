/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNSVGRect.h"
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>

@implementation ABI41_0_0RNSVGRect

- (void)setX:(ABI41_0_0RNSVGLength *)x
{
    if ([x isEqualTo:_x]) {
        return;
    }
    [self invalidate];
    _x = x;
}

- (void)setY:(ABI41_0_0RNSVGLength *)y
{
    if ([y isEqualTo:_y]) {
        return;
    }
    [self invalidate];
    _y = y;
}

- (void)setRectwidth:(ABI41_0_0RNSVGLength *)rectwidth
{
    if ([rectwidth isEqualTo:_rectwidth]) {
        return;
    }
    [self invalidate];
    _rectwidth = rectwidth;
}

- (void)setRectheight:(ABI41_0_0RNSVGLength *)rectheight
{
    if ([rectheight isEqualTo:_rectheight]) {
        return;
    }
    [self invalidate];
    _rectheight = rectheight;
}

- (void)setRx:(ABI41_0_0RNSVGLength *)rx
{
    if ([rx isEqualTo:_rx]) {
        return;
    }
    [self invalidate];
    _rx = rx;
}

- (void)setRy:(ABI41_0_0RNSVGLength *)ry
{
    if ([ry isEqualTo:_ry]) {
        return;
    }
    [self invalidate];
    _ry = ry;
}

- (CGPathRef)getPath:(CGContextRef)context
{
    CGMutablePathRef path = CGPathCreateMutable();
    CGFloat x = [self relativeOnWidth:self.x];
    CGFloat y = [self relativeOnHeight:self.y];
    CGFloat width = [self relativeOnWidth:self.rectwidth];
    CGFloat height = [self relativeOnHeight:self.rectheight];

    if (self.rx != nil || self.ry != nil) {
        CGFloat rx = 0;
        CGFloat ry = 0;
        if (self.rx == nil) {
            ry = [self relativeOnHeight:self.ry];
            rx = ry;
        } else if (self.ry == nil) {
            rx = [self relativeOnWidth:self.rx];
            ry = rx;
        } else {
            rx = [self relativeOnWidth:self.rx];
            ry = [self relativeOnHeight:self.ry];
        }

        if (rx > width / 2) {
            rx = width / 2;
        }

        if (ry > height / 2) {
            ry = height / 2;
        }

        CGPathAddRoundedRect(path, nil, CGRectMake(x, y, width, height), rx, ry);
    } else {
        CGPathAddRect(path, nil, CGRectMake(x, y, width, height));
    }

    return (CGPathRef)CFAutorelease(path);
}

@end
