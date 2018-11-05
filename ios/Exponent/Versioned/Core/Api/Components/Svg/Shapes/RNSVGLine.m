/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGLine.h"
#import <React/RCTLog.h>

@implementation RNSVGLine

- (void)setX1:(NSString *)x1
{
    if (x1 == _x1) {
        return;
    }
    [self invalidate];
    _x1 = x1;
}

- (void)setY1:(NSString *)y1
{
    if (y1 == _y1) {
        return;
    }
    [self invalidate];
    _y1 = y1;
}

- (void)setX2:(NSString *)x2
{
    if (x2 == _x2) {
        return;
    }
    [self invalidate];
    _x2 = x2;
}

- (void)setY2:(NSString *)y2
{
    if (y2 == _y2) {
        return;
    }
    [self invalidate];
    _y2 = y2;
}

- (CGPathRef)getPath:(CGContextRef)context
{
    CGMutablePathRef path = CGPathCreateMutable();
    CGFloat x1 = [self relativeOnWidth:self.x1];
    CGFloat y1 = [self relativeOnHeight:self.y1];
    CGFloat x2 = [self relativeOnWidth:self.x2];
    CGFloat y2 = [self relativeOnHeight:self.y2];
    CGPathMoveToPoint(path, nil, x1, y1);
    CGPathAddLineToPoint(path, nil, x2, y2);
    
    return (CGPathRef)CFAutorelease(path);
}

@end
