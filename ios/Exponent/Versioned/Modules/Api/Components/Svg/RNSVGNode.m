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

@implementation RNSVGNode
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

- (void)reactSetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor
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
        if (self.clipRule == kRNSVGCGFCRuleEvenodd) {
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

- (RNSVGSvgView *)getSvgView
{
    UIView *parent = self.superview;
    while (parent && [parent class] != [RNSVGSvgView class]) {
        parent = parent.superview;
    }

    return (RNSVGSvgView *)parent;
}

- (void)saveDefinition
{
    if (self.name) {
        RNSVGSvgView* svg = [self getSvgView];
        [svg defineTemplate:self templateRef:self.name];
    }
}

- (void)mergeProperties:(__kindof RNSVGNode *)target mergeList:(NSArray<NSString *> *)mergeList
{
    // abstract
}

- (void)mergeProperties:(__kindof RNSVGNode *)target mergeList:(NSArray<NSString *> *)mergeList inherited:(BOOL)inherited
{
    // abstract
}

- (void)traverseSubviews:(BOOL (^)(RNSVGNode *node))block
{
    for (RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            if (!block(node)) {
                break;
            }
        }
    }
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
