/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGEllipse.h"
#import <React/RCTLog.h>

@implementation RNSVGEllipse

- (void)setCx:(RNSVGLength *)cx
{
    if ([cx isEqualTo:_cx]) {
        return;
    }
    [self invalidate];
    _cx = cx;
}

- (void)setCy:(RNSVGLength *)cy
{
    if ([cy isEqualTo:_cy]) {
        return;
    }
    [self invalidate];
    _cy = cy;
}

- (void)setRx:(RNSVGLength *)rx
{
    if ([rx isEqualTo:_rx]) {
        return;
    }
    [self invalidate];
    _rx = rx;
}

- (void)setRy:(RNSVGLength *)ry
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
    CGFloat cx = [self relativeOnWidth:self.cx];
    CGFloat cy = [self relativeOnHeight:self.cy];
    CGFloat rx = [self relativeOnWidth:self.rx];
    CGFloat ry = [self relativeOnHeight:self.ry];
    CGPathAddEllipseInRect(path, nil, CGRectMake(cx - rx, cy - ry, rx * 2, ry * 2));
    return (CGPathRef)CFAutorelease(path);
}

@end
