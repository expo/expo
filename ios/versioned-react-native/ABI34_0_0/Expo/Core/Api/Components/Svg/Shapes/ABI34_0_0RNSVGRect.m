/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RNSVGRect.h"
#import <ReactABI34_0_0/ABI34_0_0RCTLog.h>

@implementation ABI34_0_0RNSVGRect

- (void)setX:(ABI34_0_0RNSVGLength *)x
{
    if ([x isEqualTo:_x]) {
        return;
    }
    [self invalidate];
    _x = x;
}

- (void)setY:(ABI34_0_0RNSVGLength *)y
{
    if ([y isEqualTo:_y]) {
        return;
    }
    [self invalidate];
    _y = y;
}

- (void)setRectwidth:(ABI34_0_0RNSVGLength *)rectwidth
{
    if ([rectwidth isEqualTo:_rectwidth]) {
        return;
    }
    [self invalidate];
    _rectwidth = rectwidth;
}

- (void)setRectheight:(ABI34_0_0RNSVGLength *)rectheight
{
    if ([rectheight isEqualTo:_rectheight]) {
        return;
    }
    [self invalidate];
    _rectheight = rectheight;
}

- (void)setRx:(ABI34_0_0RNSVGLength *)rx
{
    if ([rx isEqualTo:_rx]) {
        return;
    }
    [self invalidate];
    _rx = rx;
}

- (void)setRy:(ABI34_0_0RNSVGLength *)ry
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
    CGFloat rx = [self relativeOnWidth:self.rx];
    CGFloat ry = [self relativeOnHeight:self.ry];

    if (rx != 0 || ry != 0) {
        if (rx == 0) {
            rx = ry;
        } else if (ry == 0) {
            ry = rx;
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
