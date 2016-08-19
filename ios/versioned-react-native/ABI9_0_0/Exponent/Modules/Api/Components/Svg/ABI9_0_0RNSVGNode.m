/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI9_0_0RNSVGNode.h"
#import "ABI9_0_0RNSVGContainer.h"
#import "ABI9_0_0RNSVGClipPath.h"

@implementation ABI9_0_0RNSVGNode
{
    BOOL _transparent;
}

- (instancetype)init
{
    if (self = [super init]) {
        self.opacity = 1;
    }
    return self;
}

- (void)insertReactABI9_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
    [super insertReactABI9_0_0Subview:subview atIndex:atIndex];
    [self insertSubview:subview atIndex:atIndex];
    [self invalidate];
}

- (void)removeReactABI9_0_0Subview:(UIView *)subview
{
    [super removeReactABI9_0_0Subview:subview];
    [self invalidate];
}

- (void)didUpdateReactABI9_0_0Subviews
{
    // Do nothing, as subviews are inserted by insertReactABI9_0_0Subview:
}

- (void)invalidate
{
    id<ABI9_0_0RNSVGContainer> container = (id<ABI9_0_0RNSVGContainer>)self.superview;
    [container invalidate];
}

- (void)ReactABI9_0_0SetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor
{
    self.backgroundColor = inheritedBackgroundColor;
}

- (void)setOpacity:(CGFloat)opacity
{
    if (opacity == _opacity) {
        return;
    }

    if (opacity < 0) {
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

- (void)setClipPath:(CGPathRef)clipPath
{
    if (_clipPath == clipPath) {
        return;
    }
    [self invalidate];
    CGPathRelease(_clipPath);
    _clipPath = CGPathRetain(clipPath);
}

- (void)setClipPathRef:(NSString *)clipPathRef
{
    if (_clipPathRef == clipPathRef) {
        return;
    }
    [self invalidate];
    self.clipPath = nil;
    _clipPathRef = clipPathRef;
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

- (void)renderClip:(CGContextRef)context
{
    if (self.clipPathRef) {
        self.clipPath = [[[self getSvgView] getDefinedClipPath:self.clipPathRef] getPath:context];
    }
}

- (void)clip:(CGContextRef)context
{
    CGPathRef clipPath  = self.clipPath;

    if (clipPath) {
        CGContextAddPath(context, clipPath);
        if (self.clipRule == kABI9_0_0RNSVGCGFCRuleEvenodd) {
            CGContextEOClip(context);
        } else {
            CGContextClip(context);
        }
    }
}

- (CGPathRef)getPath: (CGContextRef) context
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

- (ABI9_0_0RNSVGSvgView *)getSvgView
{
    UIView *parent = self.superview;
    while (parent && [parent class] != [ABI9_0_0RNSVGSvgView class]) {
        parent = parent.superview;
    }

    return (ABI9_0_0RNSVGSvgView *)parent;
}

- (void)saveDefinition
{
    if (self.name) {
        ABI9_0_0RNSVGSvgView* svg = [self getSvgView];
        [svg defineTemplate:self templateRef:self.name];
    }
}

- (void)mergeProperties:(__kindof ABI9_0_0RNSVGNode *)target mergeList:(NSArray<NSString *> *)mergeList
{
    // abstract
}

- (void)mergeProperties:(__kindof ABI9_0_0RNSVGNode *)target mergeList:(NSArray<NSString *> *)mergeList inherited:(BOOL)inherited
{
    // abstract
}

- (void)resetProperties
{
    // abstract
}

- (void)dealloc
{
    CGPathRelease(_clipPath);
}

@end
