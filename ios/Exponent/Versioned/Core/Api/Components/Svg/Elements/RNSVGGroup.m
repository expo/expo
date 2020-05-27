/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGGroup.h"
#import "RNSVGClipPath.h"
#import "RNSVGMask.h"

@implementation RNSVGGroup
{
    RNSVGGlyphContext *_glyphContext;
}

- (void)setFont:(NSDictionary*)font
{
    if (font == _font) {
        return;
    }

    [self invalidate];
    _font = font;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
    [self clip:context];
    [self setupGlyphContext:context];
    [self renderGroupTo:context rect:rect];
}

- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect
{
    [self pushGlyphContext];

    __block CGRect bounds = CGRectNull;

    [self traverseSubviews:^(UIView *node) {
        if ([node isKindOfClass:[RNSVGMask class]] || [node isKindOfClass:[RNSVGClipPath class]]) {
            // no-op
        } else if ([node isKindOfClass:[RNSVGNode class]]) {
            RNSVGNode* svgNode = (RNSVGNode*)node;
            if (svgNode.display && [@"none" isEqualToString:svgNode.display]) {
                return YES;
            }
            if (svgNode.responsible && !self.svgView.responsible) {
                self.svgView.responsible = YES;
            }

            if ([node isKindOfClass:[RNSVGRenderable class]]) {
                [(RNSVGRenderable*)node mergeProperties:self];
            }

            [svgNode renderTo:context rect:rect];

            CGRect nodeRect = svgNode.clientRect;
            if (!CGRectIsEmpty(nodeRect)) {
                bounds = CGRectUnion(bounds, nodeRect);
            }

            if ([node isKindOfClass:[RNSVGRenderable class]]) {
                [(RNSVGRenderable*)node resetProperties];
            }
        } else if ([node isKindOfClass:[RNSVGSvgView class]]) {
            RNSVGSvgView* svgView = (RNSVGSvgView*)node;
            CGFloat width = [self relativeOnWidth:svgView.bbWidth];
            CGFloat height = [self relativeOnHeight:svgView.bbHeight];
            CGRect rect = CGRectMake(0, 0, width, height);
            CGContextClipToRect(context, rect);
            [svgView drawToContext:context withRect:rect];
        } else {
            [node drawRect:rect];
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

- (void)setupGlyphContext:(CGContextRef)context
{
    CGRect clipBounds = CGContextGetClipBoundingBox(context);
    clipBounds = CGRectApplyAffineTransform(clipBounds, self.matrix);
    clipBounds = CGRectApplyAffineTransform(clipBounds, self.transforms);
    CGFloat width = CGRectGetWidth(clipBounds);
    CGFloat height = CGRectGetHeight(clipBounds);

    _glyphContext = [[RNSVGGlyphContext alloc] initWithWidth:width
                                                      height:height];
}

- (RNSVGGlyphContext *)getGlyphContext
{
    return _glyphContext;
}

- (void)pushGlyphContext
{
    __weak typeof(self) weakSelf = self;
    [[self.textRoot getGlyphContext] pushContext:weakSelf font:self.font];
}

- (void)popGlyphContext
{
    [[self.textRoot getGlyphContext] popContext];
}

- (void)renderPathTo:(CGContextRef)context rect:(CGRect)rect
{
    [super renderLayerTo:context rect:rect];
}

- (CGPathRef)getPath:(CGContextRef)context
{
    CGPathRef cached = self.path;
    if (cached) {
        return cached;
    }
    CGMutablePathRef __block path = CGPathCreateMutable();
    [self traverseSubviews:^(RNSVGNode *node) {
        if ([node isKindOfClass:[RNSVGNode class]] && ![node isKindOfClass:[RNSVGMask class]]) {
            CGAffineTransform transform = CGAffineTransformConcat(node.matrix, node.transforms);
            CGPathAddPath(path, &transform, [node getPath:context]);
            CGPathAddPath(path, &transform, [node markerPath]);
            node.dirty = false;
        }
        return YES;
    }];

    cached = CGPathRetain(CFAutorelease(path));
    self.path = cached;
    return cached;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    CGPoint transformed = CGPointApplyAffineTransform(point, self.invmatrix);
    transformed = CGPointApplyAffineTransform(transformed, self.invTransform);

    if (!CGRectContainsPoint(self.pathBounds, transformed)) {
        return nil;
    }

    if (self.clipPath) {
        RNSVGClipPath *clipNode = (RNSVGClipPath*)[self.svgView getDefinedClipPath:self.clipPath];
        if ([clipNode isSimpleClipPath]) {
            CGPathRef clipPath = [self getClipPath];
            if (clipPath && !CGPathContainsPoint(clipPath, nil, transformed, clipNode.clipRule == kRNSVGCGFCRuleEvenodd)) {
                return nil;
            }
        } else {
            RNSVGRenderable *clipGroup = (RNSVGRenderable*)clipNode;
            if (![clipGroup hitTest:transformed withEvent:event]) {
                return nil;
            }
        }
    }

    if (!event) {
        NSPredicate *const anyActive = [NSPredicate predicateWithFormat:@"self isKindOfClass: %@ AND active == TRUE", [RNSVGNode class]];
        NSArray *const filtered = [self.subviews filteredArrayUsingPredicate:anyActive];
        if ([filtered count] != 0) {
            return [filtered.lastObject hitTest:transformed withEvent:event];
        }
    }

    for (UIView *node in [self.subviews reverseObjectEnumerator]) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            if ([node isKindOfClass:[RNSVGMask class]]) {
                continue;
            }
            RNSVGNode* svgNode = (RNSVGNode*)node;
            if (event) {
                svgNode.active = NO;
            }
            UIView *hitChild = [svgNode hitTest:transformed withEvent:event];
            if (hitChild) {
                svgNode.active = YES;
                return (svgNode.responsible || (svgNode != hitChild)) ? hitChild : self;
            }
        } else if ([node isKindOfClass:[RNSVGSvgView class]]) {
            RNSVGSvgView* svgView = (RNSVGSvgView*)node;
            UIView *hitChild = [svgView hitTest:transformed withEvent:event];
            if (hitChild) {
                return hitChild;
            }
        }
    }

    UIView *hitSelf = [super hitTest:transformed withEvent:event];
    if (hitSelf) {
        return hitSelf;
    }

    return nil;
}

- (void)parseReference
{
    self.dirty = false;
    if (self.name) {
        typeof(self) __weak weakSelf = self;
        [self.svgView defineTemplate:weakSelf templateName:self.name];
    }

    [self traverseSubviews:^(RNSVGNode *node) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            [node parseReference];
        }
        return YES;
    }];
}

- (void)resetProperties
{
    [self traverseSubviews:^(__kindof RNSVGNode *node) {
        if ([node isKindOfClass:[RNSVGRenderable class]]) {
            [(RNSVGRenderable*)node resetProperties];
        }
        return YES;
    }];
}

@end
