/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGSvgView.h"
#import "ABI42_0_0RNSVGViewBox.h"
#import "ABI42_0_0RNSVGNode.h"
#import <ABI42_0_0React/ABI42_0_0RCTLog.h>

@implementation ABI42_0_0RNSVGSvgView
{
    NSMutableDictionary<NSString *, ABI42_0_0RNSVGNode *> *_clipPaths;
    NSMutableDictionary<NSString *, ABI42_0_0RNSVGNode *> *_templates;
    NSMutableDictionary<NSString *, ABI42_0_0RNSVGPainter *> *_painters;
    NSMutableDictionary<NSString *, ABI42_0_0RNSVGNode *> *_markers;
    NSMutableDictionary<NSString *, ABI42_0_0RNSVGNode *> *_masks;
    CGAffineTransform _invviewBoxTransform;
    bool rendered;
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
#if !TARGET_OS_OSX // Not available on macOS
        // This is necessary to ensure that [self setNeedsDisplay] actually triggers
        // a redraw when our parent transitions between hidden and visible.
        self.contentMode = UIViewContentModeRedraw;
#endif
        rendered = false;
    }
    return self;
}

- (void)insertABI42_0_0ReactSubview:(ABI42_0_0RNSVGView *)subview atIndex:(NSInteger)atIndex
{
    [super insertABI42_0_0ReactSubview:subview atIndex:atIndex];
    [self insertSubview:subview atIndex:atIndex];
    [self invalidate];
}

- (void)removeABI42_0_0ReactSubview:(ABI42_0_0RNSVGView *)subview
{
    [super removeABI42_0_0ReactSubview:subview];
    [self invalidate];
}

- (void)didUpdateABI42_0_0ReactSubviews
{
    // Do nothing, as subviews are inserted by insertABI42_0_0ReactSubview:
}

- (void)clearChildCache
{
    if (!rendered) {
        return;
    }
    rendered = false;
    for (__kindof ABI42_0_0RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[ABI42_0_0RNSVGNode class]]) {
            [node clearChildCache];
        }
    }
}

- (void)invalidate
{
    ABI42_0_0RNSVGPlatformView* parent = self.superview;
    if ([parent isKindOfClass:[ABI42_0_0RNSVGNode class]]) {
        if (!rendered) {
            return;
        }
        ABI42_0_0RNSVGNode* svgNode = (ABI42_0_0RNSVGNode*)parent;
        [svgNode invalidate];
        rendered = false;
        return;
    }
    [self setNeedsDisplay];
}

- (void)tintColorDidChange
{
    [self invalidate];
    [self clearChildCache];
}

- (void)setMinX:(CGFloat)minX
{
    if (minX == _minX) {
        return;
    }

    [self invalidate];
    [self clearChildCache];
    _minX = minX;
}

- (void)setMinY:(CGFloat)minY
{
    if (minY == _minY) {
        return;
    }

    [self invalidate];
    [self clearChildCache];
    _minY = minY;
}

- (void)setVbWidth:(CGFloat)vbWidth
{
    if (vbWidth == _vbWidth) {
        return;
    }

    [self invalidate];
    [self clearChildCache];
    _vbWidth = vbWidth;
}

- (void)setVbHeight:(CGFloat)vbHeight
{
    if (_vbHeight == vbHeight) {
        return;
    }

    [self invalidate];
    [self clearChildCache];
    _vbHeight = vbHeight;
}

- (void)setBbWidth:(ABI42_0_0RNSVGLength *)bbWidth
{
    if ([bbWidth isEqualTo:_bbWidth]) {
        return;
    }

    [self invalidate];
    [self clearChildCache];
    _bbWidth = bbWidth;
}

- (void)setBbHeight:(ABI42_0_0RNSVGLength *)bbHeight
{
    if ([bbHeight isEqualTo:_bbHeight]) {
        return;
    }

    [self invalidate];
    [self clearChildCache];
    _bbHeight = bbHeight;
}

- (void)setAlign:(NSString *)align
{
    if ([align isEqualToString:_align]) {
        return;
    }

    [self invalidate];
    [self clearChildCache];
    _align = align;
}

- (void)setMeetOrSlice:(ABI42_0_0RNSVGVBMOS)meetOrSlice
{
    if (meetOrSlice == _meetOrSlice) {
        return;
    }

    [self invalidate];
    [self clearChildCache];
    _meetOrSlice = meetOrSlice;
}

- (void)drawToContext:(CGContextRef)context withRect:(CGRect)rect {
    rendered = true;
    self.initialCTM = CGContextGetCTM(context);
    self.invInitialCTM = CGAffineTransformInvert(self.initialCTM);
    if (self.align) {
        CGRect tRect = CGRectMake(self.minX, self.minY, self.vbWidth, self.vbHeight);
        _viewBoxTransform = [ABI42_0_0RNSVGViewBox getTransform:tRect
                                                 eRect:rect
                                                 align:self.align
                                           meetOrSlice:self.meetOrSlice];
        _invviewBoxTransform = CGAffineTransformInvert(_viewBoxTransform);
        CGContextConcatCTM(context, _viewBoxTransform);
    } else {
        _viewBoxTransform = CGAffineTransformIdentity;
        _invviewBoxTransform = CGAffineTransformIdentity;
    }

    for (ABI42_0_0RNSVGView *node in self.subviews) {
        if ([node isKindOfClass:[ABI42_0_0RNSVGNode class]]) {
            ABI42_0_0RNSVGNode *svg = (ABI42_0_0RNSVGNode *)node;
            [svg renderTo:context
                     rect:rect];
        } else {
            [node drawRect:rect];
        }
    }
}

- (void)drawRect:(CGRect)rect
{
    ABI42_0_0RNSVGPlatformView* parent = self.superview;
    if ([parent isKindOfClass:[ABI42_0_0RNSVGNode class]]) {
        return;
    }
    rendered = true;
    _clipPaths = nil;
    _templates = nil;
    _painters = nil;
    _boundingBox = rect;
    CGContextRef context = UIGraphicsGetCurrentContext();

    for (ABI42_0_0RNSVGPlatformView *node in self.subviews) {
        if ([node isKindOfClass:[ABI42_0_0RNSVGNode class]]) {
            ABI42_0_0RNSVGNode *svg = (ABI42_0_0RNSVGNode *)node;
            if (svg.responsible && !self.responsible) {
                self.responsible = YES;
            }

            [svg parseReference];
        }
    }

    [self drawToContext:context withRect:rect];
}

- (ABI42_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    CGPoint transformed = point;
    if (self.align) {
        transformed = CGPointApplyAffineTransform(transformed, _invviewBoxTransform);
    }
    for (ABI42_0_0RNSVGNode *node in [self.subviews reverseObjectEnumerator]) {
        if (![node isKindOfClass:[ABI42_0_0RNSVGNode class]]) {
            continue;
        }

        if (event) {
            node.active = NO;
        }

        ABI42_0_0RNSVGPlatformView *hitChild = [node hitTest:transformed withEvent:event];

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
    [self clearChildCache];
    [self drawRect:_boundingBox];
    [self clearChildCache];
    [self invalidate];
    NSData *imageData = UIImagePNGRepresentation(UIGraphicsGetImageFromCurrentImageContext());
    NSString *base64 = [imageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
    UIGraphicsEndImageContext();
    return base64;
}

- (NSString *)getDataURLwithBounds:(CGRect)bounds
{
    UIGraphicsBeginImageContextWithOptions(bounds.size, NO, 1);
    [self clearChildCache];
    [self drawRect:bounds];
    [self clearChildCache];
    [self invalidate];
    NSData *imageData = UIImagePNGRepresentation(UIGraphicsGetImageFromCurrentImageContext());
    NSString *base64 = [imageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
    UIGraphicsEndImageContext();
    return base64;
}

- (void)ABI42_0_0ReactSetInheritedBackgroundColor:(ABI42_0_0RNSVGColor *)inheritedBackgroundColor
{
    self.backgroundColor = inheritedBackgroundColor;
}

- (void)defineClipPath:(__kindof ABI42_0_0RNSVGNode *)clipPath clipPathName:(NSString *)clipPathName
{
    if (!_clipPaths) {
        _clipPaths = [[NSMutableDictionary alloc] init];
    }
    [_clipPaths setObject:clipPath forKey:clipPathName];
}

- (ABI42_0_0RNSVGNode *)getDefinedClipPath:(NSString *)clipPathName
{
    return _clipPaths ? [_clipPaths objectForKey:clipPathName] : nil;
}

- (void)defineTemplate:(ABI42_0_0RNSVGNode *)template templateName:(NSString *)templateName
{
    if (!_templates) {
        _templates = [[NSMutableDictionary alloc] init];
    }
    [_templates setObject:template forKey:templateName];
}

- (ABI42_0_0RNSVGNode *)getDefinedTemplate:(NSString *)templateName
{
    return _templates ? [_templates objectForKey:templateName] : nil;
}


- (void)definePainter:(ABI42_0_0RNSVGPainter *)painter painterName:(NSString *)painterName
{
    if (!_painters) {
        _painters = [[NSMutableDictionary alloc] init];
    }
    [_painters setObject:painter forKey:painterName];
}

- (ABI42_0_0RNSVGPainter *)getDefinedPainter:(NSString *)painterName;
{
    return _painters ? [_painters objectForKey:painterName] : nil;
}

- (void)defineMarker:(ABI42_0_0RNSVGNode *)marker markerName:(NSString *)markerName
{
    if (!_markers) {
        _markers = [[NSMutableDictionary alloc] init];
    }
    [_markers setObject:marker forKey:markerName];
}

- (ABI42_0_0RNSVGNode *)getDefinedMarker:(NSString *)markerName;
{
    return _markers ? [_markers objectForKey:markerName] : nil;
}

- (void)defineMask:(ABI42_0_0RNSVGNode *)mask maskName:(NSString *)maskName
{
    if (!_masks) {
        _masks = [[NSMutableDictionary alloc] init];
    }
    [_masks setObject:mask forKey:maskName];
}

- (ABI42_0_0RNSVGNode *)getDefinedMask:(NSString *)maskName;
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
