/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGText.h"
#import "DevLauncherRNSVGTextPath.h"
#import <React/RCTFont.h>
#import <CoreText/CoreText.h>
#import "DevLauncherRNSVGGlyphContext.h"
#import "DevLauncherRNSVGTextProperties.h"

@implementation DevLauncherRNSVGText
{
    DevLauncherRNSVGGlyphContext *_glyphContext;
    NSString *_alignmentBaseline;
    NSString *_baselineShift;
    CGFloat cachedAdvance;
}

- (void)invalidate
{
    if (self.dirty || self.merging) {
        return;
    }
    [super invalidate];
    [self clearChildCache];
}

- (void)clearPath
{
    [super clearPath];
    cachedAdvance = NAN;
}

- (void)setInlineSize:(DevLauncherRNSVGLength *)inlineSize
{
    if ([inlineSize isEqualTo:_inlineSize]) {
        return;
    }
    [self invalidate];
    _inlineSize = inlineSize;
}

- (void)setTextLength:(DevLauncherRNSVGLength *)textLength
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

- (void)setDeltaX:(NSArray<DevLauncherRNSVGLength *> *)deltaX
{
    if (deltaX == _deltaX) {
        return;
    }
    [self invalidate];
    _deltaX = deltaX;
}

- (void)setDeltaY:(NSArray<DevLauncherRNSVGLength *> *)deltaY
{
    if (deltaY == _deltaY) {
        return;
    }
    [self invalidate];
    _deltaY = deltaY;
}

- (void)setPositionX:(NSArray<DevLauncherRNSVGLength *>*)positionX
{
    if (positionX == _positionX) {
        return;
    }
    [self invalidate];
    _positionX = positionX;
}

- (void)setPositionY:(NSArray<DevLauncherRNSVGLength *>*)positionY
{
    if (positionY == _positionY) {
        return;
    }
    [self invalidate];
    _positionY = positionY;
}

- (void)setRotate:(NSArray<DevLauncherRNSVGLength *> *)rotate
{
    if (rotate == _rotate) {
        return;
    }
    [self invalidate];
    _rotate = rotate;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
    CGContextSaveGState(context);
    [self clip:context];
    [self setupGlyphContext:context];
    [self pushGlyphContext];
    [super renderGroupTo:context rect:rect];
    [self popGlyphContext];
    CGContextRestoreGState(context);
}

- (void)setupGlyphContext:(CGContextRef)context
{
    CGRect bounds = CGContextGetClipBoundingBox(context);
    CGSize size = bounds.size;
    _glyphContext = [[DevLauncherRNSVGGlyphContext alloc] initWithWidth:size.width
                                                      height:size.height];
}

- (CGPathRef)getGroupPath:(CGContextRef)context
{
    CGPathRef path = self.path;
    if (path) {
        return path;
    }
    [self pushGlyphContext];
    path = [super getPath:context];
    [self popGlyphContext];
    self.path = path;
    return path;
}

- (CGPathRef)getPath:(CGContextRef)context
{
    CGPathRef path = self.path;
    if (path) {
        return path;
    }
    [self setupGlyphContext:context];
    return [self getGroupPath:context];
}

- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect
{
    [self pushGlyphContext];
    [super renderGroupTo:context rect:rect];
    [self popGlyphContext];
}

// TODO: Optimisation required
- (DevLauncherRNSVGText *)textRoot
{
    DevLauncherRNSVGText *root = self;
    while (root && [root class] != [DevLauncherRNSVGText class]) {
        if (![root isKindOfClass:[DevLauncherRNSVGText class]]) {
            //todo: throw exception here
            break;
        }
        root = (DevLauncherRNSVGText*)[root superview];
    }

    return root;
}

- (NSString *)alignmentBaseline
{
    if (_alignmentBaseline != nil) {
        return _alignmentBaseline;
    }

    DevLauncherRNSVGPlatformView* parent = self.superview;
    while (parent != nil) {
        if ([parent isKindOfClass:[DevLauncherRNSVGText class]]) {
            DevLauncherRNSVGText* node = (DevLauncherRNSVGText*)parent;
            NSString* baseline = node.alignmentBaseline;
            if (baseline != nil) {
                _alignmentBaseline = baseline;
                return baseline;
            }
        }
        parent = [parent superview];
    }

    if (_alignmentBaseline == nil) {
        _alignmentBaseline = DevLauncherRNSVGAlignmentBaselineStrings[0];
    }
    return _alignmentBaseline;
}

- (NSString *)baselineShift
{
    if (_baselineShift != nil) {
        return _baselineShift;
    }

    DevLauncherRNSVGPlatformView* parent = [self superview];
    while (parent != nil) {
        if ([parent isKindOfClass:[DevLauncherRNSVGText class]]) {
            DevLauncherRNSVGText* node = (DevLauncherRNSVGText*)parent;
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

- (DevLauncherRNSVGGlyphContext *)getGlyphContext
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

- (DevLauncherRNSVGText*)getTextAnchorRoot
{
    DevLauncherRNSVGGlyphContext* gc = [self.textRoot getGlyphContext];
    NSArray* font = [gc getFontContext];
    DevLauncherRNSVGText* node = self;
    DevLauncherRNSVGPlatformView* parent = [self superview];
    for (NSInteger i = [font count] - 1; i >= 0; i--) {
        DevLauncherRNSVGFontData* fontData = [font objectAtIndex:i];
        if (![parent isKindOfClass:[DevLauncherRNSVGText class]] ||
            fontData->textAnchor == DevLauncherRNSVGTextAnchorStart ||
            node.positionX != nil) {
            return node;
        }
        node = (DevLauncherRNSVGText*) parent;
        parent = [node superview];
    }
    return node;
}

- (CGFloat)getSubtreeTextChunksTotalAdvance
{
    if (!isnan(cachedAdvance)) {
        return cachedAdvance;
    }
    CGFloat advance = 0;
    for (DevLauncherRNSVGView *node in self.subviews) {
        if ([node isKindOfClass:[DevLauncherRNSVGText class]]) {
            DevLauncherRNSVGText *text = (DevLauncherRNSVGText*)node;
            advance += [text getSubtreeTextChunksTotalAdvance];
        }
    }
    cachedAdvance = advance;
    return advance;
}

@end
