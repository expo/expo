/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI17_0_0RNSVGText.h"
#import "ABI17_0_0RNSVGTextPath.h"
#import <ReactABI17_0_0/ABI17_0_0RCTFont.h>
#import <CoreText/CoreText.h>
#import "ABI17_0_0RNSVGGlyphContext.h"

@implementation ABI17_0_0RNSVGText
{
    ABI17_0_0RNSVGText *_textRoot;
    ABI17_0_0RNSVGGlyphContext *_glyphContext;
}

- (void)setTextAnchor:(ABI17_0_0RNSVGTextAnchor)textAnchor
{
    [self invalidate];
    _textAnchor = textAnchor;
}

- (void)renderLayerTo:(CGContextRef)context
{
    [self clip:context];
    CGContextSaveGState(context);
    [self setupGlyphContext:context];
    
    CGPathRef path = [self getGroupPath:context];
    CGAffineTransform transform = [self getAlignTransform:path];
    CGContextConcatCTM(context, transform);
    [self renderGroupTo:context];
    [self releaseCachedPath];
    CGContextRestoreGState(context);
    
    
    CGPathRef transformedPath = CGPathCreateCopyByTransformingPath(path, &transform);
    [self setHitArea:transformedPath];
    CGPathRelease(transformedPath);
}

- (void)setupGlyphContext:(CGContextRef)context
{
    _glyphContext = [[ABI17_0_0RNSVGGlyphContext alloc] initWithDimensions:[self getContextWidth]
                                                  height:[self getContextHeight]];
}

// release the cached CGPathRef for ABI17_0_0RNSVGTSpan
- (void)releaseCachedPath
{
    [self traverseSubviews:^BOOL(__kindof ABI17_0_0RNSVGNode *node) {
        ABI17_0_0RNSVGText *text = node;
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
    CGAffineTransform transform = [self getAlignTransform:groupPath];
    [self releaseCachedPath];
    
    return (CGPathRef)CFAutorelease(CGPathCreateCopyByTransformingPath(groupPath, &transform));
}

- (void)renderGroupTo:(CGContextRef)context
{
    [self pushGlyphContext];
    [super renderGroupTo:context];
    [self popGlyphContext];
}

- (CGAffineTransform)getAlignTransform:(CGPathRef)path
{
    CGFloat width = CGRectGetWidth(CGPathGetBoundingBox(path));
    CGFloat x = 0;
    
    switch ([self getComputedTextAnchor]) {
        case kRNSVGTextAnchorMiddle:
            x = -width / 2;
            break;
        case kRNSVGTextAnchorEnd:
            x = -width;
            break;
        default: ;
    }
    
    return CGAffineTransformMakeTranslation(x, 0);
}

- (ABI17_0_0RNSVGTextAnchor)getComputedTextAnchor
{
    ABI17_0_0RNSVGTextAnchor anchor = self.textAnchor;
    if (self.subviews.count > 0) {
        ABI17_0_0RNSVGText *child = [self.subviews firstObject];
        
        while (child.subviews.count && anchor == kRNSVGTextAnchorAuto) {
            anchor = child.textAnchor;
            child = [child.subviews firstObject];
        }
    }
    return anchor;
}

- (ABI17_0_0RNSVGText *)getTextRoot
{
    if (!_textRoot) {
        _textRoot = self;
        while (_textRoot && [_textRoot class] != [ABI17_0_0RNSVGText class]) {
            if (![_textRoot isKindOfClass:[ABI17_0_0RNSVGText class]]) {
                //todo: throw exception here
                break;
            }
            _textRoot = (ABI17_0_0RNSVGText*)[_textRoot superview];
        }
    }
    
    return _textRoot;
}

- (ABI17_0_0RNSVGGlyphContext *)getGlyphContext
{
    return _glyphContext;
}

- (void)pushGlyphContext
{
    [[[self getTextRoot] getGlyphContext] pushContext:self.font
                                               deltaX:self.deltaX
                                               deltaY:self.deltaY
                                            positionX:self.positionX
                                            positionY:self.positionY];
}

- (void)popGlyphContext
{
    [[[self getTextRoot] getGlyphContext] popContext];
}

- (CTFontRef)getFontFromContext
{
    return [[[self getTextRoot] getGlyphContext] getGlyphFont];
}

- (CGPoint)getGlyphPointFromContext:(CGPoint)offset glyphWidth:(CGFloat)glyphWidth
{
    return [[[self getTextRoot] getGlyphContext] getNextGlyphPoint:(CGPoint)offset glyphWidth:glyphWidth];
}

@end
