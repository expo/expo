/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGNode.h"
#import "RNSVGContainer.h"
#import "RNSVGClipPath.h"
#import "RNSVGGroup.h"
#import "RNSVGGlyphContext.h"

@implementation RNSVGNode
{
    RNSVGGroup *_textRoot;
    RNSVGGlyphContext *glyphContext;
    BOOL _transparent;
    CGPathRef _cachedClipPath;
    RNSVGSvgView *_svgView;
}

CGFloat const M_SQRT1_2l = 0.707106781186547524400844362104849039;
CGFloat const RNSVG_DEFAULT_FONT_SIZE = 12;

- (instancetype)init
{
    if (self = [super init]) {
        self.opacity = 1;
    }
    return self;
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
    [super insertReactSubview:subview atIndex:atIndex];
    [self insertSubview:subview atIndex:atIndex];
    [self invalidate];
}

- (void)removeReactSubview:(UIView *)subview
{
    [super removeReactSubview:subview];
    [self invalidate];
}

- (void)didUpdateReactSubviews
{
    // Do nothing, as subviews are inserted by insertReactSubview:
}

- (void)invalidate
{
    id<RNSVGContainer> container = (id<RNSVGContainer>)self.superview;
    [container invalidate];
}

- (RNSVGGroup *)getTextRoot
{
    RNSVGNode* node = self;
    if (_textRoot == nil) {
        while (node != nil) {
            if ([node isKindOfClass:[RNSVGGroup class]] && [((RNSVGGroup*) node) getGlyphContext] != nil) {
                _textRoot = (RNSVGGroup*)node;
                break;
            }

            UIView* parent = [node superview];

            if (![node isKindOfClass:[RNSVGNode class]]) {
                node = nil;
            } else {
                node = (RNSVGNode*)parent;
            }
        }
    }

    return _textRoot;
}

- (RNSVGGroup *)getParentTextRoot
{
    RNSVGNode* parent = (RNSVGGroup*)[self superview];
    if (![parent isKindOfClass:[RNSVGGroup class]]) {
        return nil;
    } else {
        return [parent getTextRoot];
    }
}

- (CGFloat)getFontSizeFromContext
{
    RNSVGGroup* root = [self getTextRoot];
    if (root == nil) {
        return RNSVG_DEFAULT_FONT_SIZE;
    }

    if (glyphContext == nil) {
        glyphContext = [root getGlyphContext];
    }

    return [glyphContext getFontSize];
}

- (void)reactSetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor
{
    self.backgroundColor = inheritedBackgroundColor;
}

- (void)setOpacity:(CGFloat)opacity
{
    if (opacity == _opacity) {
        return;
    }

    if (opacity <= 0) {
        opacity = 0;
    } else if (opacity > 1) {
        opacity = 1;
    }

    [self invalidate];
    _transparent = opacity < 1;
    _opacity = opacity;
}

- (void)setMatrix:(CGAffineTransform)matrix
{
    if (CGAffineTransformEqualToTransform(matrix, _matrix)) {
        return;
    }
    [self invalidate];
    _matrix = matrix;
}

- (void)setClipPath:(NSString *)clipPath
{
    if (_clipPath == clipPath) {
        return;
    }
    CGPathRelease(_cachedClipPath);
    _cachedClipPath = nil;
    _clipPath = clipPath;
    [self invalidate];
}

- (void)beginTransparencyLayer:(CGContextRef)context
{
    if (_transparent) {
        CGContextBeginTransparencyLayer(context, NULL);
    }
}

- (void)endTransparencyLayer:(CGContextRef)context
{
    if (_transparent) {
        CGContextEndTransparencyLayer(context);
    }
}

- (void)renderTo:(CGContextRef)context
{
    // abstract
}

- (CGPathRef)getClipPath
{
    return _cachedClipPath;
}

- (CGPathRef)getClipPath:(CGContextRef)context
{
    if (self.clipPath) {
        CGPathRelease(_cachedClipPath);
        _cachedClipPath = CGPathRetain([[[self getSvgView] getDefinedClipPath:self.clipPath] getPath:context]);
    }

    return [self getClipPath];
}

- (void)clip:(CGContextRef)context
{
    CGPathRef clipPath = [self getClipPath:context];

    if (clipPath) {
        CGContextAddPath(context, clipPath);
        if (self.clipRule == kRNSVGCGFCRuleEvenodd) {
            CGContextEOClip(context);
        } else {
            CGContextClip(context);
        }
    }
}

- (CGPathRef)getPath: (CGContextRef)context
{
    // abstract
    return nil;
}

- (void)renderLayerTo:(CGContextRef)context
{
    // abstract
}

// hitTest delagate
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{

    // abstract
    return nil;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event withTransform:(CGAffineTransform)transfrom
{
    // abstract
    return nil;
}

- (RNSVGSvgView *)getSvgView
{
    if (_svgView) {
        return _svgView;
    }

    __kindof UIView *parent = self.superview;

    if ([parent class] == [RNSVGSvgView class]) {
        _svgView = parent;
    } else if ([parent isKindOfClass:[RNSVGNode class]]) {
        RNSVGNode *node = parent;
        _svgView = [node getSvgView];
    } else {
        RCTLogError(@"RNSVG: %@ should be descendant of a SvgViewShadow.", NSStringFromClass(self.class));
    }

    return _svgView;
}

- (CGFloat)relativeOnWidth:(NSString *)length
{
    return [RNSVGPropHelper fromRelativeWithNSString:length
                                         relative:[self getContextWidth]
                                           offset:0
                                            scale:1
                                         fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)relativeOnHeight:(NSString *)length
{
    return [RNSVGPropHelper fromRelativeWithNSString:length
                                         relative:[self getContextHeight]
                                           offset:0
                                            scale:1
                                         fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)relativeOnOther:(NSString *)length
{
    CGFloat width = [self getContextWidth];
    CGFloat height = [self getContextHeight];
    CGFloat powX = width * width;
    CGFloat powY = height * height;
    CGFloat r = sqrt(powX + powY) * M_SQRT1_2l;
    return [RNSVGPropHelper fromRelativeWithNSString:length
                                         relative:r
                                           offset:0
                                            scale:1
                                         fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)getContextWidth
{
    RNSVGGroup * root = [self getTextRoot];
    RNSVGGlyphContext * gc = [root getGlyphContext];
    if (root == nil || gc == nil) {
        return CGRectGetWidth([[self getSvgView] getContextBounds]);
    } else {
        return [gc getWidth];
    }
}

- (CGFloat)getContextHeight
{
    RNSVGGroup * root = [self getTextRoot];
    RNSVGGlyphContext * gc = [root getGlyphContext];
    if (root == nil || gc == nil) {
        return CGRectGetHeight([[self getSvgView] getContextBounds]);
    } else {
        return [gc getHeight];
    }
}

- (CGFloat)getContextLeft
{
    return CGRectGetMinX([[self getSvgView] getContextBounds]);
}

- (CGFloat)getContextTop
{
    return CGRectGetMinY([[self getSvgView] getContextBounds]);
}

- (void)parseReference
{
    if (self.name) {
        RNSVGSvgView* svg = [self getSvgView];
        [svg defineTemplate:self templateName:self.name];
    }
}

- (void)traverseSubviews:(BOOL (^)(__kindof RNSVGNode *node))block
{
    for (RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            if (!block(node)) {
                break;
            }
        }
    }
}

- (void)dealloc
{
    CGPathRelease(_cachedClipPath);
}

@end
