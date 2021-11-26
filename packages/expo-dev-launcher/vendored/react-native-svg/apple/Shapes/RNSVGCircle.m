/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGCircle.h"
#import <React/RCTLog.h>

@implementation RNSVGCircle

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

- (void)setR:(RNSVGLength *)r
{
    if ([r isEqualTo:_r]) {
        return;
    }
    [self invalidate];
    _r = r;
}

- (CGPathRef)getPath:(CGContextRef)context
{
    CGMutablePathRef path = CGPathCreateMutable();
    CGFloat cx = [self relativeOnWidth:self.cx];
    CGFloat cy = [self relativeOnHeight:self.cy];
    CGFloat r = [self relativeOnOther:self.r];
    CGPathAddArc(path, nil, cx, cy, r, 0, 2 * (CGFloat)M_PI, NO);
    return (CGPathRef)CFAutorelease(path);
}

@end
