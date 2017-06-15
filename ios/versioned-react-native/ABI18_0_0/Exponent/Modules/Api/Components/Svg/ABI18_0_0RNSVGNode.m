/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI18_0_0RNSVGNode.h"
#import "ABI18_0_0RNSVGContainer.h"
#import "ABI18_0_0RNSVGClipPath.h"

@implementation ABI18_0_0RNSVGNode
{
    BOOL _transparent;
    CGPathRef _cachedClipPath;
    ABI18_0_0RNSVGSvgView *_svgView;
}

- (instancetype)init
{
    if (self = [super init]) {
        self.opacity = 1;
    }
    return self;
}

- (void)insertReactABI18_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
    [super insertReactABI18_0_0Subview:subview atIndex:atIndex];
    [self insertSubview:subview atIndex:atIndex];
    [self invalidate];
}

- (void)removeReactABI18_0_0Subview:(UIView *)subview
{
    [super removeReactABI18_0_0Subview:subview];
    [self invalidate];
}

- (void)didUpdateReactABI18_0_0Subviews
{
    // Do nothing, as subviews are inserted by insertReactABI18_0_0Subview:
}

- (void)invalidate
{
    id<ABI18_0_0RNSVGContainer> container = (id<ABI18_0_0RNSVGContainer>)self.superview;
    [container invalidate];
}

- (void)ReactABI18_0_0SetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor
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

- (ABI18_0_0RNSVGSvgView *)getSvgView
{
    if (_svgView) {
        return _svgView;
    }

    __kindof UIView *parent = self.superview;

    if ([parent class] == [ABI18_0_0RNSVGSvgView class]) {
        _svgView = parent;
    } else if ([parent isKindOfClass:[ABI18_0_0RNSVGNode class]]) {
        ABI18_0_0RNSVGNode *node = parent;
        _svgView = [node getSvgView];
    } else {
        ABI18_0_0RCTLogError(@"ABI18_0_0RNSVG: %@ should be descendant of a SvgViewShadow.", NSStringFromClass(self.class));
    }

    return _svgView;
}

- (CGFloat)relativeOnWidth:(NSString *)length
{
    return [ABI18_0_0RNSVGPercentageConverter stringToFloat:length relative:[self getContextWidth] offset:0];
}

- (CGFloat)relativeOnHeight:(NSString *)length
{
    return [ABI18_0_0RNSVGPercentageConverter stringToFloat:length relative:[self getContextHeight] offset:0];
}

- (CGFloat)getContextWidth
{
    return CGRectGetWidth([[self getSvgView] getContextBounds]);
}

- (CGFloat)getContextHeight
{
    return CGRectGetHeight([[self getSvgView] getContextBounds]);
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
        ABI18_0_0RNSVGSvgView* svg = [self getSvgView];
        [svg defineTemplate:self templateName:self.name];
    }
}

- (void)traverseSubviews:(BOOL (^)(__kindof ABI18_0_0RNSVGNode *node))block
{
    for (ABI18_0_0RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[ABI18_0_0RNSVGNode class]]) {
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
