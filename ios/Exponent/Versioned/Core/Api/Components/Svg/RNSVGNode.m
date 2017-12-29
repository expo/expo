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
    CGPathRef _cachedClipPath;
    RNSVGSvgView *_svgView;
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
    return [RNSVGPercentageConverter stringToFloat:length relative:[self getContextWidth] offset:0];
}

- (CGFloat)relativeOnHeight:(NSString *)length
{
    return [RNSVGPercentageConverter stringToFloat:length relative:[self getContextHeight] offset:0];
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
