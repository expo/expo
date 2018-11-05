/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RNSVGCircle.h"
#import <ReactABI30_0_0/ABI30_0_0RCTLog.h>

@implementation ABI30_0_0RNSVGCircle

- (void)setCx:(NSString *)cx
{
    if (cx == _cx) {
        return;
    }
    [self invalidate];
    _cx = cx;
}

- (void)setCy:(NSString *)cy
{
    if (cy == _cy) {
        return;
    }
    [self invalidate];
    _cy = cy;
}

- (void)setR:(NSString *)r
{
    if (r == _r) {
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
    CGPathAddArc(path, nil, cx, cy, r, 0, 2 * M_PI, NO);
    return (CGPathRef)CFAutorelease(path);
}

@end
