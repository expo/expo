/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGGroup.h"

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

- (void)renderLayerTo:(CGContextRef)context
{
    [self clip:context];
    [self setupGlyphContext:context];
    [self renderGroupTo:context];
}

- (void)renderGroupTo:(CGContextRef)context
{
    [self pushGlyphContext];
    RNSVGSvgView* svg = [self getSvgView];
    [self traverseSubviews:^(RNSVGNode *node) {
        if (node.responsible && !svg.responsible) {
            svg.responsible = YES;
        }

        if ([node isKindOfClass:[RNSVGRenderable class]]) {
            [(RNSVGRenderable*)node mergeProperties:self];
        }

        [node renderTo:context];

        if ([node isKindOfClass:[RNSVGRenderable class]]) {
            [(RNSVGRenderable*)node resetProperties];
        }

        return YES;
    }];
    [self popGlyphContext];
}

- (void)setupGlyphContext:(CGContextRef)context
{
    CGRect clipBounds = CGContextGetClipBoundingBox(context);
    clipBounds = CGRectApplyAffineTransform(clipBounds, self.matrix);
    CGFloat width = CGRectGetWidth(clipBounds);
    CGFloat height = CGRectGetHeight(clipBounds);

    _glyphContext = [[RNSVGGlyphContext alloc] initWithScale:1 width:width
                                                   height:height];
}

- (RNSVGGlyphContext *)getGlyphContext
{
    return _glyphContext;
}

- (void)pushGlyphContext
{
    [[[self getTextRoot] getGlyphContext] pushContext:self font:self.font];
}

- (void)popGlyphContext
{
    [[[self getTextRoot] getGlyphContext] popContext];
}

- (void)renderPathTo:(CGContextRef)context
{
    [super renderLayerTo:context];
}

- (CGPathRef)getPath:(CGContextRef)context
{
    CGMutablePathRef __block path = CGPathCreateMutable();
    [self traverseSubviews:^(RNSVGNode *node) {
        CGAffineTransform transform = node.matrix;
        CGPathAddPath(path, &transform, [node getPath:context]);
        return YES;
    }];

    return (CGPathRef)CFAutorelease(path);
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event withTransform:(CGAffineTransform)transform
{
    UIView *hitSelf = [super hitTest:point withEvent:event withTransform:transform];
    if (hitSelf) {
        return hitSelf;
    }

    CGAffineTransform matrix = CGAffineTransformConcat(self.matrix, transform);

    CGPathRef clip = [self getClipPath];
    if (clip) {
        CGPathRef transformedClipPath = CGPathCreateCopyByTransformingPath(clip, &matrix);
        BOOL insideClipPath = CGPathContainsPoint(clip, nil, point, self.clipRule == kRNSVGCGFCRuleEvenodd);
        CGPathRelease(transformedClipPath);

        if (!insideClipPath) {
            return nil;
        }

    }

    for (RNSVGNode *node in [self.subviews reverseObjectEnumerator]) {
        if (![node isKindOfClass:[RNSVGNode class]]) {
            continue;
        }

        if (event) {
            node.active = NO;
        } else if (node.active) {
            return node;
        }

        UIView *hitChild = [node hitTest: point withEvent:event withTransform:matrix];

        if (hitChild) {
            node.active = YES;
            return (node.responsible || (node != hitChild)) ? hitChild : self;
        }
    }
    return nil;
}

- (void)parseReference
{
    if (self.name) {
        RNSVGSvgView* svg = [self getSvgView];
        [svg defineTemplate:self templateName:self.name];
    }

    [self traverseSubviews:^(__kindof RNSVGNode *node) {
        [node parseReference];
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
