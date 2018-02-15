/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGText.h"
#import "RNSVGTextPath.h"
#import <React/RCTFont.h>
#import <CoreText/CoreText.h>
#import "RNSVGGlyphContext.h"
#import "RNSVGTextProperties.h"

@implementation RNSVGText
{
    RNSVGText *_textRoot;
    RNSVGGlyphContext *_glyphContext;
}

- (void)renderLayerTo:(CGContextRef)context
{
    [self clip:context];
    CGContextSaveGState(context);
    [self setupGlyphContext:context];

    CGPathRef path = [self getGroupPath:context];
    [self renderGroupTo:context];
    [self releaseCachedPath];
    CGContextRestoreGState(context);

    CGPathRef transformedPath = CGPathCreateCopyByTransformingPath(path, &CGAffineTransformIdentity);
    [self setHitArea:transformedPath];
    CGPathRelease(transformedPath);
}

- (void)setupGlyphContext:(CGContextRef)context
{
    _glyphContext = [[RNSVGGlyphContext alloc] initWithScale:1 width:[self getContextWidth]
                                                   height:[self getContextHeight]];
}

// release the cached CGPathRef for RNSVGTSpan
- (void)releaseCachedPath
{
    [self traverseSubviews:^BOOL(__kindof RNSVGNode *node) {
        RNSVGText *text = node;
        [text releaseCachedPath];
        return YES;
    }];
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
    [self releaseCachedPath];

    return (CGPathRef)CFAutorelease(CGPathCreateCopyByTransformingPath(groupPath, &CGAffineTransformIdentity));
}

- (void)renderGroupTo:(CGContextRef)context
{
    [self pushGlyphContext];
    [super renderGroupTo:context];
    [self popGlyphContext];
}

- (RNSVGText *)getTextRoot
{
    if (!_textRoot) {
        _textRoot = self;
        while (_textRoot && [_textRoot class] != [RNSVGText class]) {
            if (![_textRoot isKindOfClass:[RNSVGText class]]) {
                //todo: throw exception here
                break;
            }
            _textRoot = (RNSVGText*)[_textRoot superview];
        }
    }

    return _textRoot;
}

- (NSString*) getAlignmentBaseline
{
    if (self.alignmentBaseline != nil) {
        return self.alignmentBaseline;
    }
    UIView* parent = [self superview];
    while (parent != nil) {
        if ([parent isKindOfClass:[RNSVGText class]]) {
            RNSVGText* node = (RNSVGText*)parent;
            NSString* baseline = node.alignmentBaseline;
            if (baseline != nil) {
                self.alignmentBaseline = baseline;
                return baseline;
            }
        }
        parent = [parent superview];
    }
    if (self.alignmentBaseline == nil) {
        self.alignmentBaseline = RNSVGAlignmentBaselineStrings[0];
    }
    return self.alignmentBaseline;
}

- (NSString*) getBaselineShift
{
    if (self.baselineShift != nil) {
        return self.baselineShift;
    }
    if (self.baselineShift == nil) {
        UIView* parent = [self superview];
        while (parent != nil) {
            if ([parent isKindOfClass:[RNSVGText class]]) {
                RNSVGText* node = (RNSVGText*)parent;
                NSString* baselineShift = node.baselineShift;
                if (baselineShift != nil) {
                    self.baselineShift = baselineShift;
                    return baselineShift;
                }
            }
            parent = [parent superview];
        }
    }
    if (self.baselineShift == nil) {
        self.baselineShift = @"";
    }
    return self.baselineShift;
}

- (RNSVGGlyphContext *)getGlyphContext
{
    return _glyphContext;
}

- (void)pushGlyphContext
{
    [[[self getTextRoot] getGlyphContext] pushContext:self
                                                              font:self.font
                                                                 x:self.positionX
                                                                 y:self.positionY
                                                            deltaX:self.deltaX
                                                            deltaY:self.deltaY
                                                            rotate:self.rotate];
}

- (void)popGlyphContext
{
    [[[self getTextRoot] getGlyphContext] popContext];
}

- (CTFontRef)getFontFromContext
{
    return [[[self getTextRoot] getGlyphContext] getGlyphFont];
}

@end
