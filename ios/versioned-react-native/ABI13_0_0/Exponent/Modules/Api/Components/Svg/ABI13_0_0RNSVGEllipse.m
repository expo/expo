/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI13_0_0RNSVGEllipse.h"
#import <ReactABI13_0_0/ABI13_0_0RCTLog.h>

@implementation ABI13_0_0RNSVGEllipse

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

- (void)setRx:(NSString *)rx
{
    if (rx == _rx) {
        return;
    }
    [self invalidate];
    _rx = rx;
}

- (void)setRy:(NSString *)ry
{
    if (ry == _ry) {
        return;
    }
    [self invalidate];
    _ry = ry;
}

- (CGPathRef)getPath:(CGContextRef)context
{
    [self setBoundingBox:CGContextGetClipBoundingBox(context)];
    CGMutablePathRef path = CGPathCreateMutable();
    CGFloat cx = [self getWidthRelatedValue:self.cx];
    CGFloat cy = [self getHeightRelatedValue:self.cy];
    CGFloat rx = [self getWidthRelatedValue:self.rx];
    CGFloat ry = [self getHeightRelatedValue:self.ry];
    CGPathAddEllipseInRect(path, nil, CGRectMake(cx - rx, cy - ry, rx * 2, ry * 2));
    return (CGPathRef)CFAutorelease(path);
}

@end
