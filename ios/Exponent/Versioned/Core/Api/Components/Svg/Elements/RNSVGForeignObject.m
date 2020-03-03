/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGForeignObject.h"
#import "RNSVGNode.h"

@implementation RNSVGForeignObject

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return nil;
}

- (void)parseReference
{
    self.dirty = false;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
    [self clip:context];
    CGContextTranslateCTM(context, [self relativeOnWidth:self.x], [self relativeOnHeight:self.y]);
    CGRect clip = CGRectMake(
                             0,
                             0,
                             [self relativeOnWidth:self.foreignObjectwidth],
                             [self relativeOnHeight:self.foreignObjectheight]
                             );
    CGContextClipToRect(context, clip);
    [super renderLayerTo:context rect:rect];
}

- (void)setX:(RNSVGLength *)x
{
    if ([x isEqualTo:_x]) {
        return;
    }

    _x = x;
    [self invalidate];
}

- (void)setY:(RNSVGLength *)y
{
    if ([y isEqualTo:_y]) {
        return;
    }

    _y = y;
    [self invalidate];
}

- (void)setForeignObjectwidth:(RNSVGLength *)foreignObjectwidth
{
    if ([foreignObjectwidth isEqualTo:_foreignObjectwidth]) {
        return;
    }

    _foreignObjectwidth = foreignObjectwidth;
    [self invalidate];
}

- (void)setForeignObjectheight:(RNSVGLength *)foreignObjectheight
{
    if ([foreignObjectheight isEqualTo:_foreignObjectheight]) {
        return;
    }

    _foreignObjectheight = foreignObjectheight;
    [self invalidate];
}

@end

