/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI43_0_0RNSVGForeignObject.h"
#import "ABI43_0_0RNSVGClipPath.h"
#import "ABI43_0_0RNSVGMask.h"
#import "ABI43_0_0RNSVGNode.h"

@implementation ABI43_0_0RNSVGForeignObject

- (ABI43_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
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

- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect
{
    [self pushGlyphContext];

    __block CGRect bounds = CGRectNull;

    [self traverseSubviews:^(ABI43_0_0RNSVGView *node) {
        if ([node isKindOfClass:[ABI43_0_0RNSVGMask class]] || [node isKindOfClass:[ABI43_0_0RNSVGClipPath class]]) {
            // no-op
        } else if ([node isKindOfClass:[ABI43_0_0RNSVGNode class]]) {
            ABI43_0_0RNSVGNode* svgNode = (ABI43_0_0RNSVGNode*)node;
            if (svgNode.display && [@"none" isEqualToString:svgNode.display]) {
                return YES;
            }
            if (svgNode.responsible && !self.svgView.responsible) {
                self.svgView.responsible = YES;
            }

            if ([node isKindOfClass:[ABI43_0_0RNSVGRenderable class]]) {
                [(ABI43_0_0RNSVGRenderable*)node mergeProperties:self];
            }

            [svgNode renderTo:context rect:rect];

            CGRect nodeRect = svgNode.clientRect;
            if (!CGRectIsEmpty(nodeRect)) {
                bounds = CGRectUnion(bounds, nodeRect);
            }

            if ([node isKindOfClass:[ABI43_0_0RNSVGRenderable class]]) {
                [(ABI43_0_0RNSVGRenderable*)node resetProperties];
            }
        } else if ([node isKindOfClass:[ABI43_0_0RNSVGSvgView class]]) {
            ABI43_0_0RNSVGSvgView* svgView = (ABI43_0_0RNSVGSvgView*)node;
            CGFloat width = [self relativeOnWidth:svgView.bbWidth];
            CGFloat height = [self relativeOnHeight:svgView.bbHeight];
            CGRect rect = CGRectMake(0, 0, width, height);
            CGContextClipToRect(context, rect);
            [svgView drawToContext:context withRect:rect];
        } else {
            node.hidden = false;
            [node.layer renderInContext:context];
            node.hidden = true;
        }

        return YES;
    }];
    CGPathRef path = [self getPath:context];
    [self setHitArea:path];
    if (!CGRectEqualToRect(bounds, CGRectNull)) {
        self.clientRect = bounds;
        self.fillBounds = CGPathGetBoundingBox(path);
        self.strokeBounds = CGPathGetBoundingBox(self.strokePath);
        self.pathBounds = CGRectUnion(self.fillBounds, self.strokeBounds);

        CGAffineTransform current = CGContextGetCTM(context);
        CGAffineTransform svgToClientTransform = CGAffineTransformConcat(current, self.svgView.invInitialCTM);

        self.ctm = svgToClientTransform;
        self.screenCTM = current;

        CGAffineTransform transform = CGAffineTransformConcat(self.matrix, self.transforms);
        CGPoint mid = CGPointMake(CGRectGetMidX(bounds), CGRectGetMidY(bounds));
        CGPoint center = CGPointApplyAffineTransform(mid, transform);

        self.bounds = bounds;
        if (!isnan(center.x) && !isnan(center.y)) {
            self.center = center;
        }
        self.frame = bounds;
    }

    [self popGlyphContext];
}

- (void)drawRect:(CGRect)rect
{
    [self invalidate];
}

- (void)setX:(ABI43_0_0RNSVGLength *)x
{
    if ([x isEqualTo:_x]) {
        return;
    }

    _x = x;
    [self invalidate];
}

- (void)setY:(ABI43_0_0RNSVGLength *)y
{
    if ([y isEqualTo:_y]) {
        return;
    }

    _y = y;
    [self invalidate];
}

- (void)setForeignObjectwidth:(ABI43_0_0RNSVGLength *)foreignObjectwidth
{
    if ([foreignObjectwidth isEqualTo:_foreignObjectwidth]) {
        return;
    }

    _foreignObjectwidth = foreignObjectwidth;
    [self invalidate];
}

- (void)setForeignObjectheight:(ABI43_0_0RNSVGLength *)foreignObjectheight
{
    if ([foreignObjectheight isEqualTo:_foreignObjectheight]) {
        return;
    }

    _foreignObjectheight = foreignObjectheight;
    [self invalidate];
}

@end

