/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RNSVGNode.h"
#import "ABI28_0_0RNSVGContainer.h"
#import "ABI28_0_0RNSVGClipPath.h"
#import "ABI28_0_0RNSVGGroup.h"
#import "ABI28_0_0RNSVGGlyphContext.h"

@implementation ABI28_0_0RNSVGNode
{
    ABI28_0_0RNSVGGroup *_textRoot;
    ABI28_0_0RNSVGGlyphContext *glyphContext;
    BOOL _transparent;
    CGPathRef _cachedClipPath;
    ABI28_0_0RNSVGSvgView *_svgView;
}

CGFloat const ABI28_0_0M_SQRT1_2l = 0.707106781186547524400844362104849039;
CGFloat const ABI28_0_0RNSVG_DEFAULT_FONT_SIZE = 12;

- (instancetype)init
{
    if (self = [super init]) {
        self.opacity = 1;
    }
    return self;
}

- (void)insertReactABI28_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
    [super insertReactABI28_0_0Subview:subview atIndex:atIndex];
    [self insertSubview:subview atIndex:atIndex];
    [self invalidate];
}

- (void)removeReactABI28_0_0Subview:(UIView *)subview
{
    [super removeReactABI28_0_0Subview:subview];
    [self invalidate];
}

- (void)didUpdateReactABI28_0_0Subviews
{
    // Do nothing, as subviews are inserted by insertReactABI28_0_0Subview:
}

- (void)invalidate
{
    id<ABI28_0_0RNSVGContainer> container = (id<ABI28_0_0RNSVGContainer>)self.superview;
    [container invalidate];
}

- (ABI28_0_0RNSVGGroup *)getTextRoot
{
    ABI28_0_0RNSVGNode* node = self;
    if (_textRoot == nil) {
        while (node != nil) {
            if ([node isKindOfClass:[ABI28_0_0RNSVGGroup class]] && [((ABI28_0_0RNSVGGroup*) node) getGlyphContext] != nil) {
                _textRoot = (ABI28_0_0RNSVGGroup*)node;
                break;
            }

            UIView* parent = [node superview];

            if (![node isKindOfClass:[ABI28_0_0RNSVGNode class]]) {
                node = nil;
            } else {
                node = (ABI28_0_0RNSVGNode*)parent;
            }
        }
    }

    return _textRoot;
}

- (ABI28_0_0RNSVGGroup *)getParentTextRoot
{
    ABI28_0_0RNSVGNode* parent = (ABI28_0_0RNSVGGroup*)[self superview];
    if (![parent isKindOfClass:[ABI28_0_0RNSVGGroup class]]) {
        return nil;
    } else {
        return [parent getTextRoot];
    }
}

- (CGFloat)getFontSizeFromContext
{
    ABI28_0_0RNSVGGroup* root = [self getTextRoot];
    if (root == nil) {
        return ABI28_0_0RNSVG_DEFAULT_FONT_SIZE;
    }

    if (glyphContext == nil) {
        glyphContext = [root getGlyphContext];
    }

    return [glyphContext getFontSize];
}

- (void)ReactABI28_0_0SetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor
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

- (ABI28_0_0RNSVGSvgView *)getSvgView
{
    if (_svgView) {
        return _svgView;
    }

    __kindof UIView *parent = self.superview;

    if ([parent class] == [ABI28_0_0RNSVGSvgView class]) {
        _svgView = parent;
    } else if ([parent isKindOfClass:[ABI28_0_0RNSVGNode class]]) {
        ABI28_0_0RNSVGNode *node = parent;
        _svgView = [node getSvgView];
    } else {
        ABI28_0_0RCTLogError(@"ABI28_0_0RNSVG: %@ should be descendant of a SvgViewShadow.", NSStringFromClass(self.class));
    }

    return _svgView;
}

- (CGFloat)relativeOnWidth:(NSString *)length
{
    return [ABI28_0_0RNSVGPropHelper fromRelativeWithNSString:length
                                         relative:[self getContextWidth]
                                           offset:0
                                            scale:1
                                         fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)relativeOnHeight:(NSString *)length
{
    return [ABI28_0_0RNSVGPropHelper fromRelativeWithNSString:length
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
    CGFloat r = sqrt(powX + powY) * ABI28_0_0M_SQRT1_2l;
    return [ABI28_0_0RNSVGPropHelper fromRelativeWithNSString:length
                                         relative:r
                                           offset:0
                                            scale:1
                                         fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)getContextWidth
{
    ABI28_0_0RNSVGGroup * root = [self getTextRoot];
    ABI28_0_0RNSVGGlyphContext * gc = [root getGlyphContext];
    if (root == nil || gc == nil) {
        return CGRectGetWidth([[self getSvgView] getContextBounds]);
    } else {
        return [gc getWidth];
    }
}

- (CGFloat)getContextHeight
{
    ABI28_0_0RNSVGGroup * root = [self getTextRoot];
    ABI28_0_0RNSVGGlyphContext * gc = [root getGlyphContext];
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
        ABI28_0_0RNSVGSvgView* svg = [self getSvgView];
        [svg defineTemplate:self templateName:self.name];
    }
}

- (void)traverseSubviews:(BOOL (^)(__kindof ABI28_0_0RNSVGNode *node))block
{
    for (ABI28_0_0RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[ABI28_0_0RNSVGNode class]]) {
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
