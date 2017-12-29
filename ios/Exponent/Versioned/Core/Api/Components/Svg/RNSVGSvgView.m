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
    CGRect _boundingBox;
    CGAffineTransform _viewBoxTransform;
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
    [self setNeedsDisplay];
}

- (void)setMinX:(CGFloat)minX
{
    if (minX == _minX) {
        return;
    }
    
    [self invalidate];
    _minX = minX;
}

- (void)setMinY:(CGFloat)minY
{
    if (minY == _minY) {
        return;
    }
    
    [self invalidate];
    _minY = minY;
}

- (void)setVbWidth:(CGFloat)vbWidth
{
    if (vbWidth == _vbWidth) {
        return;
    }
    
    [self invalidate];
    _vbWidth = vbWidth;
}

- (void)setVbHeight:(CGFloat)vbHeight
{
    if (_vbHeight == vbHeight) {
        return;
    }
    
    [self invalidate];
    _vbHeight = vbHeight;
}

- (void)setAlign:(NSString *)align
{
    if ([align isEqualToString:_align]) {
        return;
    }
    
    [self invalidate];
    _align = align;
}

- (void)setMeetOrSlice:(RNSVGVBMOS)meetOrSlice
{
    if (meetOrSlice == _meetOrSlice) {
        return;
    }
    
    [self invalidate];
    _meetOrSlice = meetOrSlice;
}

- (void)drawRect:(CGRect)rect
{
    _clipPaths = nil;
    _templates = nil;
    _painters = nil;
    _boundingBox = rect;
    CGContextRef context = UIGraphicsGetCurrentContext();
    
    if (self.align) {
        _viewBoxTransform = [RNSVGViewBox getTransform:CGRectMake(self.minX, self.minY, self.vbWidth, self.vbHeight)
                                                 eRect:rect
                                                 align:self.align
                                           meetOrSlice:self.meetOrSlice
                                            fromSymbol:NO];
        CGContextConcatCTM(context, _viewBoxTransform);
    }
    
    for (RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            if (node.responsible && !self.responsible) {
                self.responsible = YES;
            }
            
            [node parseReference];
        }
    }
    
    for (RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            [node renderTo:context];
        }
    }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    if (self.align) {
        for (RNSVGNode *node in [self.subviews reverseObjectEnumerator]) {
            if (![node isKindOfClass:[RNSVGNode class]]) {
                continue;
            }
            
            if (event) {
                node.active = NO;
            } else if (node.active) {
                return node;
            }
            
            UIView *hitChild = [node hitTest: point withEvent:event withTransform:_viewBoxTransform];
            
            if (hitChild) {
                node.active = YES;
                return (node.responsible || (node != hitChild)) ? hitChild : self;
            }
        }
        return nil;
    } else {
        return [super hitTest:point withEvent:event];
    }
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

- (CGRect)getContextBounds
{
    return CGContextGetClipBoundingBox(UIGraphicsGetCurrentContext());
}

@end
