/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGSvgView.h"
#import "RNSVGViewBox.h"
#import "RNSVGNode.h"
#import <React/RCTLog.h>

@implementation RNSVGSvgView
{
    NSMutableDictionary<NSString *, RNSVGNode *> *_clipPaths;
    NSMutableDictionary<NSString *, RNSVGNode *> *_templates;
    NSMutableDictionary<NSString *, RNSVGPainter *> *_painters;
    NSMutableDictionary<NSString *, RNSVGNode *> *_masks;
    CGAffineTransform _viewBoxTransform;
    CGAffineTransform _invviewBoxTransform;
    bool rendered;
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        // This is necessary to ensure that [self setNeedsDisplay] actually triggers
        // a redraw when our parent transitions between hidden and visible.
        self.contentMode = UIViewContentModeRedraw;
        rendered = false;
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

- (void)releaseCachedPath
{
    if (!rendered) {
        return;
    }
    rendered = false;
    for (UIView *node in self.subviews) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            RNSVGNode *n = (RNSVGNode *)node;
            [n releaseCachedPath];
        }
    };
}

- (void)invalidate
{
    [self setNeedsDisplay];
}

- (void)setMinX:(CGFloat)minX
{
    if (minX == _minX) {
        return;
    }

    [self invalidate];
    [self releaseCachedPath];
    _minX = minX;
}

- (void)setMinY:(CGFloat)minY
{
    if (minY == _minY) {
        return;
    }

    [self invalidate];
    [self releaseCachedPath];
    _minY = minY;
}

- (void)setVbWidth:(CGFloat)vbWidth
{
    if (vbWidth == _vbWidth) {
        return;
    }

    [self invalidate];
    [self releaseCachedPath];
    _vbWidth = vbWidth;
}

- (void)setVbHeight:(CGFloat)vbHeight
{
    if (_vbHeight == vbHeight) {
        return;
    }

    [self invalidate];
    [self releaseCachedPath];
    _vbHeight = vbHeight;
}

- (void)setBbWidth:(NSString *)bbWidth
{
    if ([bbWidth isEqualToString:_bbWidth]) {
        return;
    }

    [self invalidate];
    [self releaseCachedPath];
    _bbWidth = bbWidth;
}

- (void)setBbHeight:(NSString *)bbHeight
{
    if ([bbHeight isEqualToString:_bbHeight]) {
        return;
    }

    [self invalidate];
    [self releaseCachedPath];
    _bbHeight = bbHeight;
}

- (void)setAlign:(NSString *)align
{
    if ([align isEqualToString:_align]) {
        return;
    }

    [self invalidate];
    [self releaseCachedPath];
    _align = align;
}

- (void)setMeetOrSlice:(RNSVGVBMOS)meetOrSlice
{
    if (meetOrSlice == _meetOrSlice) {
        return;
    }

    [self invalidate];
    [self releaseCachedPath];
    _meetOrSlice = meetOrSlice;
}

- (void)drawToContext:(CGContextRef)context withRect:(CGRect)rect {

    self.initialCTM = CGContextGetCTM(context);
    self.invInitialCTM = CGAffineTransformInvert(self.initialCTM);
    if (self.align) {
        _viewBoxTransform = [RNSVGViewBox getTransform:CGRectMake(self.minX, self.minY, self.vbWidth, self.vbHeight)
                                                 eRect:rect
                                                 align:self.align
                                           meetOrSlice:self.meetOrSlice];
        _invviewBoxTransform = CGAffineTransformInvert(_viewBoxTransform);
        CGContextConcatCTM(context, _viewBoxTransform);
    }

    for (UIView *node in self.subviews) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            RNSVGNode *svg = (RNSVGNode *)node;
            [svg renderTo:context
                     rect:rect];
        } else {
            [node drawRect:rect];
        }
    }
}

- (void)drawRect:(CGRect)rect
{
    UIView* parent = self.superview;
    if ([parent isKindOfClass:[RNSVGNode class]]) {
        return;
    }
    rendered = true;
    _clipPaths = nil;
    _templates = nil;
    _painters = nil;
    _boundingBox = rect;
    CGContextRef context = UIGraphicsGetCurrentContext();

    for (UIView *node in self.subviews) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            RNSVGNode *svg = (RNSVGNode *)node;
            if (svg.responsible && !self.responsible) {
                self.responsible = YES;
            }

            [svg parseReference];
        }
    }

    [self drawToContext:context withRect:rect];
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    CGPoint transformed = point;
    if (self.align) {
        transformed = CGPointApplyAffineTransform(transformed, _invviewBoxTransform);
    }
    for (RNSVGNode *node in [self.subviews reverseObjectEnumerator]) {
        if (![node isKindOfClass:[RNSVGNode class]]) {
            continue;
        }

        if (event) {
            node.active = NO;
        } else if (node.active) {
            return node;
        }

        UIView *hitChild = [node hitTest:transformed withEvent:event];

        if (hitChild) {
            node.active = YES;
            return (node.responsible || (node != hitChild)) ? hitChild : self;
        }
    }
    return nil;
}


- (NSString *)getDataURL
{
    UIGraphicsBeginImageContextWithOptions(_boundingBox.size, NO, 0);
    [self drawRect:_boundingBox];
    NSData *imageData = UIImagePNGRepresentation(UIGraphicsGetImageFromCurrentImageContext());
    NSString *base64 = [imageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
    UIGraphicsEndImageContext();
    return base64;
}

- (void)reactSetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor
{
    self.backgroundColor = inheritedBackgroundColor;
}

- (void)defineClipPath:(__kindof RNSVGNode *)clipPath clipPathName:(NSString *)clipPathName
{
    if (!_clipPaths) {
        _clipPaths = [[NSMutableDictionary alloc] init];
    }
    [_clipPaths setObject:clipPath forKey:clipPathName];
}

- (RNSVGNode *)getDefinedClipPath:(NSString *)clipPathName
{
    return _clipPaths ? [_clipPaths objectForKey:clipPathName] : nil;
}

- (void)defineTemplate:(RNSVGNode *)template templateName:(NSString *)templateName
{
    if (!_templates) {
        _templates = [[NSMutableDictionary alloc] init];
    }
    [_templates setObject:template forKey:templateName];
}

- (RNSVGNode *)getDefinedTemplate:(NSString *)templateName
{
    return _templates ? [_templates objectForKey:templateName] : nil;
}


- (void)definePainter:(RNSVGPainter *)painter painterName:(NSString *)painterName
{
    if (!_painters) {
        _painters = [[NSMutableDictionary alloc] init];
    }
    [_painters setObject:painter forKey:painterName];
}

- (RNSVGPainter *)getDefinedPainter:(NSString *)painterName;
{
    return _painters ? [_painters objectForKey:painterName] : nil;
}

- (void)defineMask:(RNSVGNode *)mask maskName:(NSString *)maskName
{
    if (!_masks) {
        _masks = [[NSMutableDictionary alloc] init];
    }
    [_masks setObject:mask forKey:maskName];
}

- (RNSVGNode *)getDefinedMask:(NSString *)maskName;
{
    return _masks ? [_masks objectForKey:maskName] : nil;
}

- (CGRect)getContextBounds
{
    return CGContextGetClipBoundingBox(UIGraphicsGetCurrentContext());
}

- (CGAffineTransform)getViewBoxTransform
{
    return _viewBoxTransform;
}

@end
