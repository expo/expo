/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGText.h"
#import "ABI31_0_0RNSVGTextPath.h"
#import <ReactABI31_0_0/ABI31_0_0RCTFont.h>
#import <CoreText/CoreText.h>
#import "ABI31_0_0RNSVGGlyphContext.h"
#import "ABI31_0_0RNSVGTextProperties.h"

@implementation ABI31_0_0RNSVGText
{
    ABI31_0_0RNSVGGlyphContext *_glyphContext;
    NSString *_alignmentBaseline;
    NSString *_baselineShift;
    BOOL _merging;
}

- (void)invalidate
{
    if (_merging) {
        return;
    }
    [super invalidate];
    [self releaseCachedPath];
}

- (void)mergeProperties:(__kindof ABI31_0_0RNSVGRenderable *)target
{
    _merging = true;
    [super mergeProperties:target];
    _merging = false;
}

- (void)resetProperties
{
    _merging = true;
    [super resetProperties];
    _merging = false;
}

- (void)setTextLength:(ABI31_0_0RNSVGLength *)textLength
{
    if ([textLength isEqualTo:_textLength]) {
        return;
    }
    [self invalidate];
    _textLength = textLength;
}

- (void)setBaselineShift:(NSString *)baselineShift
{
    if ([baselineShift isEqualToString:_baselineShift]) {
        return;
    }
    [self invalidate];
    _baselineShift = baselineShift;
}

- (void)setLengthAdjust:(NSString *)lengthAdjust
{
    if ([lengthAdjust isEqualToString:_lengthAdjust]) {
        return;
    }
    [self invalidate];
    _lengthAdjust = lengthAdjust;
}

- (void)setAlignmentBaseline:(NSString *)alignmentBaseline
{
    if ([alignmentBaseline isEqualToString:_alignmentBaseline]) {
        return;
    }
    [self invalidate];
    _alignmentBaseline = alignmentBaseline;
}

- (void)setDeltaX:(NSArray<ABI31_0_0RNSVGLength *> *)deltaX
{
    if (deltaX == _deltaX) {
        return;
    }
    [self invalidate];
    _deltaX = deltaX;
}

- (void)setDeltaY:(NSArray<ABI31_0_0RNSVGLength *> *)deltaY
{
    if (deltaY == _deltaY) {
        return;
    }
    [self invalidate];
    _deltaY = deltaY;
}

- (void)setPositionX:(NSArray<ABI31_0_0RNSVGLength *>*)positionX
{
    if (positionX == _positionX) {
        return;
    }
    [self invalidate];
    _positionX = positionX;
}

- (void)setPositionY:(NSArray<ABI31_0_0RNSVGLength *>*)positionY
{
    if (positionY == _positionY) {
        return;
    }
    [self invalidate];
    _positionY = positionY;
}

- (void)setRotate:(NSArray<ABI31_0_0RNSVGLength *> *)rotate
{
    if (rotate == _rotate) {
        return;
    }
    [self invalidate];
    _rotate = rotate;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
    [self clip:context];
    CGContextSaveGState(context);
    [self setupGlyphContext:context];

    CGPathRef path = [self getGroupPath:context];
    [self renderGroupTo:context rect:rect];
    CGContextRestoreGState(context);

    CGPathRef transformedPath = CGPathCreateCopyByTransformingPath(path, &CGAffineTransformIdentity);
    [self setHitArea:transformedPath];
    CGPathRelease(transformedPath);
}

- (void)setupGlyphContext:(CGContextRef)context
{
    CGRect bounds = CGContextGetClipBoundingBox(context);
    CGSize size = bounds.size;
    _glyphContext = [[ABI31_0_0RNSVGGlyphContext alloc] initWithWidth:size.width
                                                      height:size.height];
}

- (CGPathRef)getGroupPath:(CGContextRef)context
{
    [self pushGlyphContext];
    CGPathRef groupPath = [super getPath:context];
    [self popGlyphContext];

    return groupPath;
}

- (CGPathRef)getPath:(CGContextRef)context
{
    [self setupGlyphContext:context];
    CGPathRef groupPath = [self getGroupPath:context];

    return (CGPathRef)CFAutorelease(CGPathCreateCopy(groupPath));
}

- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect
{
    [self pushGlyphContext];
    [super renderGroupTo:context rect:rect];
    [self popGlyphContext];
}

// TODO: Optimisation required
- (ABI31_0_0RNSVGText *)textRoot
{
    ABI31_0_0RNSVGText *root = self;
    while (root && [root class] != [ABI31_0_0RNSVGText class]) {
        if (![root isKindOfClass:[ABI31_0_0RNSVGText class]]) {
            //todo: throw exception here
            break;
        }
        root = (ABI31_0_0RNSVGText*)[root superview];
    }

    return root;
}

- (NSString *)alignmentBaseline
{
    if (_alignmentBaseline != nil) {
        return _alignmentBaseline;
    }

    UIView* parent = self.superview;
    while (parent != nil) {
        if ([parent isKindOfClass:[ABI31_0_0RNSVGText class]]) {
            ABI31_0_0RNSVGText* node = (ABI31_0_0RNSVGText*)parent;
            NSString* baseline = node.alignmentBaseline;
            if (baseline != nil) {
                _alignmentBaseline = baseline;
                return baseline;
            }
        }
        parent = [parent superview];
    }

    if (_alignmentBaseline == nil) {
        _alignmentBaseline = ABI31_0_0RNSVGAlignmentBaselineStrings[0];
    }
    return _alignmentBaseline;
}

- (NSString *)baselineShift
{
    if (_baselineShift != nil) {
        return _baselineShift;
    }

    UIView* parent = [self superview];
    while (parent != nil) {
        if ([parent isKindOfClass:[ABI31_0_0RNSVGText class]]) {
            ABI31_0_0RNSVGText* node = (ABI31_0_0RNSVGText*)parent;
            NSString* baselineShift = node.baselineShift;
            if (baselineShift != nil) {
                _baselineShift = baselineShift;
                return baselineShift;
            }
        }
        parent = [parent superview];
    }

    // set default value
    _baselineShift = @"";

    return _baselineShift;
}

- (ABI31_0_0RNSVGGlyphContext *)getGlyphContext
{
    return _glyphContext;
}

- (void)pushGlyphContext
{
    [[self.textRoot getGlyphContext] pushContext:self
                                            font:self.font
                                               x:self.positionX
                                               y:self.positionY
                                          deltaX:self.deltaX
                                          deltaY:self.deltaY
                                          rotate:self.rotate];
}

- (void)popGlyphContext
{
    [[self.textRoot getGlyphContext] popContext];
}

- (CTFontRef)getFontFromContext
{
    return [[self.textRoot getGlyphContext] getGlyphFont];
}

@end
