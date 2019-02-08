// Kindly stolen from https://github.com/BigZaphod/Chameleon
/*
 * Copyright (c) 2011, The Iconfactory. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of The Iconfactory nor the names of its contributors may
 *    be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE ICONFACTORY BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#include <TargetConditionals.h>

#if !TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
#import "UIBezierPath.h"

@implementation UIBezierPath {
    CGFloat *_lineDashPattern;
    NSInteger _lineDashCount;
    CGFloat _lineDashPhase;
}
@synthesize CGPath = _path;

- (id)init {
    self = [super init];
    if (self) {
        _path = CGPathCreateMutable();
        _lineWidth = 1;
        _lineCapStyle = kCGLineCapButt;
        _lineJoinStyle = kCGLineJoinMiter;
        _miterLimit = 10;
        _flatness = 0.6;
        _usesEvenOddFillRule = NO;
        _lineDashPattern = NULL;
        _lineDashCount = 0;
        _lineDashPhase = 0;
    }
    return self;
}

- (void)dealloc {
    if (_path) CGPathRelease(_path);
}

- (id)copyWithZone:(NSZone *)zone {
    UIBezierPath *copy = [[self class] new];

    copy.CGPath = self.CGPath;
    copy.lineWidth = self.lineWidth;
    copy.lineCapStyle = self.lineCapStyle;
    copy.lineJoinStyle = self.lineJoinStyle;
    copy.miterLimit = self.miterLimit;
    copy.flatness = self.flatness;
    copy.usesEvenOddFillRule = self.usesEvenOddFillRule;

    NSInteger lineDashCount = 0;
    [self getLineDash:NULL count:&lineDashCount phase:NULL];

    if (lineDashCount > 0) {
        CGFloat *lineDashPattern = malloc(sizeof(CGFloat) * lineDashCount);
        CGFloat lineDashPhase = 0;
        [self getLineDash:lineDashPattern count:NULL phase:&lineDashPhase];
        [copy setLineDash:lineDashPattern count:lineDashCount phase:lineDashPhase];
        free(lineDashPattern);
    }

    return copy;
}

+ (UIBezierPath *)bezierPathWithCGPath:(CGPathRef)CGPath {
    NSAssert(CGPath != NULL, @"CGPath must not be NULL");
    UIBezierPath *bezierPath = [[self alloc] init];
    bezierPath.CGPath = CGPath;
    return bezierPath;
}

+ (UIBezierPath *)bezierPath {
    UIBezierPath *bezierPath = [[self alloc] init];
    return bezierPath;
}

+ (UIBezierPath *)bezierPathWithRect:(CGRect)rect {
    CGMutablePathRef path = CGPathCreateMutable();
    CGPathAddRect(path, NULL, rect);

    UIBezierPath *bezierPath = [[self alloc] init];
    bezierPath->_path = path;
    return bezierPath;
}

+ (UIBezierPath *)bezierPathWithOvalInRect:(CGRect)rect {
    CGMutablePathRef path = CGPathCreateMutable();
    CGPathAddEllipseInRect(path, NULL, rect);

    UIBezierPath *bezierPath = [[self alloc] init];
    bezierPath->_path = path;
    return bezierPath;
}

+ (UIBezierPath *)bezierPathWithRoundedRect:(CGRect)rect
                               cornerRadius:(CGFloat)cornerRadius {
    return [self bezierPathWithRoundedRect:rect
                         byRoundingCorners:UIRectCornerAllCorners
                               cornerRadii:CGSizeMake(cornerRadius, cornerRadius)];
}

+ (UIBezierPath *)bezierPathWithRoundedRect:(CGRect)rect
                          byRoundingCorners:(UIRectCorner)corners
                                cornerRadii:(CGSize)cornerRadii {

    CGMutablePathRef path = CGPathCreateMutable();

    const CGPoint topLeft = rect.origin;
    const CGPoint topRight = CGPointMake(CGRectGetMaxX(rect), CGRectGetMinY(rect));
    const CGPoint bottomRight = CGPointMake(CGRectGetMaxX(rect), CGRectGetMaxY(rect));
    const CGPoint bottomLeft = CGPointMake(CGRectGetMinX(rect), CGRectGetMaxY(rect));

    if (corners & UIRectCornerTopLeft) {
        CGPathMoveToPoint(path, NULL, topLeft.x + cornerRadii.width, topLeft.y);
    } else {
        CGPathMoveToPoint(path, NULL, topLeft.x, topLeft.y);
    }

    if (corners & UIRectCornerTopRight) {
        CGPathAddLineToPoint(path, NULL, topRight.x - cornerRadii.width, topRight.y);
        CGPathAddCurveToPoint(path, NULL, topRight.x, topRight.y, topRight.x, topRight.y + cornerRadii.height, topRight.x, topRight.y + cornerRadii.height);
    } else {
        CGPathAddLineToPoint(path, NULL, topRight.x, topRight.y);
    }

    if (corners & UIRectCornerBottomRight) {
        CGPathAddLineToPoint(path, NULL, bottomRight.x, bottomRight.y - cornerRadii.height);
        CGPathAddCurveToPoint(path, NULL, bottomRight.x, bottomRight.y, bottomRight.x - cornerRadii.width, bottomRight.y, bottomRight.x - cornerRadii.width, bottomRight.y);
    } else {
        CGPathAddLineToPoint(path, NULL, bottomRight.x, bottomRight.y);
    }

    if (corners & UIRectCornerBottomLeft) {
        CGPathAddLineToPoint(path, NULL, bottomLeft.x + cornerRadii.width, bottomLeft.y);
        CGPathAddCurveToPoint(path, NULL, bottomLeft.x, bottomLeft.y, bottomLeft.x, bottomLeft.y - cornerRadii.height, bottomLeft.x, bottomLeft.y - cornerRadii.height);
    } else {
        CGPathAddLineToPoint(path, NULL, bottomLeft.x, bottomLeft.y);
    }

    if (corners & UIRectCornerTopLeft) {
        CGPathAddLineToPoint(path, NULL, topLeft.x, topLeft.y + cornerRadii.height);
        CGPathAddCurveToPoint(path, NULL, topLeft.x, topLeft.y, topLeft.x + cornerRadii.width, topLeft.y, topLeft.x + cornerRadii.width, topLeft.y);
    } else {
        CGPathAddLineToPoint(path, NULL, topLeft.x, topLeft.y);
    }

    CGPathCloseSubpath(path);

    UIBezierPath *bezierPath = [[self alloc] init];
    bezierPath->_path = path;
    return bezierPath;
}

+ (UIBezierPath *)bezierPathWithArcCenter:(CGPoint)center
                                   radius:(CGFloat)radius
                               startAngle:(CGFloat)startAngle
                                 endAngle:(CGFloat)endAngle
                                clockwise:(BOOL)clockwise {

    CGMutablePathRef path = CGPathCreateMutable();
    CGPathAddArc(path, NULL, center.x, center.y, radius, startAngle, endAngle, clockwise);

    UIBezierPath *bezierPath = [[self alloc] init];
    bezierPath->_path = path;
    return bezierPath;
}

- (void)moveToPoint:(CGPoint)point {
    CGMutablePathRef mutablePath = CGPathCreateMutableCopy(_path);
    CGPathMoveToPoint(mutablePath, NULL, point.x, point.y);
    self.CGPath = mutablePath;
    CGPathRelease(mutablePath);
}

- (void)addLineToPoint:(CGPoint)point {
    CGMutablePathRef mutablePath = CGPathCreateMutableCopy(_path);
    CGPathAddLineToPoint(mutablePath, NULL, point.x, point.y);
    self.CGPath = mutablePath;
    CGPathRelease(mutablePath);
}

- (void)addArcWithCenter:(CGPoint)center radius:(CGFloat)radius startAngle:(CGFloat)startAngle endAngle:(CGFloat)endAngle clockwise:(BOOL)clockwise {
    CGMutablePathRef mutablePath = CGPathCreateMutableCopy(_path);
    CGPathAddArc(mutablePath, NULL, center.x, center.y, radius, startAngle, endAngle, clockwise);
    self.CGPath = mutablePath;
    CGPathRelease(mutablePath);
}

- (void)addCurveToPoint:(CGPoint)endPoint controlPoint1:(CGPoint)controlPoint1 controlPoint2:(CGPoint)controlPoint2 {
    CGMutablePathRef mutablePath = CGPathCreateMutableCopy(_path);
    CGPathAddCurveToPoint(mutablePath, NULL, controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, endPoint.x, endPoint.y);
    self.CGPath = mutablePath;
    CGPathRelease(mutablePath);
}

- (void)addQuadCurveToPoint:(CGPoint)endPoint controlPoint:(CGPoint)controlPoint {
    CGMutablePathRef mutablePath = CGPathCreateMutableCopy(_path);
    CGPathAddQuadCurveToPoint(mutablePath, NULL, controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
    self.CGPath = mutablePath;
    CGPathRelease(mutablePath);
}

- (void)closePath {
    CGMutablePathRef mutablePath = CGPathCreateMutableCopy(_path);
    CGPathCloseSubpath(mutablePath);
    self.CGPath = mutablePath;
    CGPathRelease(mutablePath);
}

- (void)removeAllPoints {
    CGMutablePathRef mutablePath = CGPathCreateMutable();
    self.CGPath = mutablePath;
    CGPathRelease(mutablePath);
}

- (void)appendPath:(UIBezierPath *)bezierPath {
    if (bezierPath) {
        CGMutablePathRef mutablePath = CGPathCreateMutableCopy(_path);
        CGPathAddPath(mutablePath, NULL, bezierPath.CGPath);
        self.CGPath = mutablePath;
        CGPathRelease(mutablePath);
    }
}

- (void)setCGPath:(CGPathRef)path {
    NSAssert(path != NULL, @"path must not be NULL");
    if (path != _path) {
        if (_path) CGPathRelease(_path);
        _path = CGPathCreateCopy(path);
    }
}

- (CGPoint)currentPoint {
    return CGPathGetCurrentPoint(_path);
}

- (void)setLineDash:(const CGFloat *)pattern count:(NSInteger)count phase:(CGFloat)phase {
    free(_lineDashPattern);

    if (pattern && count > 0) {
        const size_t size = sizeof(CGFloat) * count;
        _lineDashPattern = malloc(size);
        bcopy(pattern, _lineDashPattern, size);
    } else {
        _lineDashPattern = NULL;
    }

    _lineDashCount = count;
    _lineDashPhase = phase;
}

- (void)getLineDash:(CGFloat *)pattern count:(NSInteger *)count phase:(CGFloat *)phase {
    if (pattern && _lineDashPattern && _lineDashCount > 0) {
        const size_t size = sizeof(CGFloat) * _lineDashCount;
        bcopy(_lineDashPattern, pattern, size);
    }

    if (count) {
        *count = _lineDashCount;
    }

    if (phase) {
        *phase = _lineDashPhase;
    }
}

- (BOOL)containsPoint:(CGPoint)point {
    return CGPathContainsPoint(_path, NULL, point, _usesEvenOddFillRule);
}

- (BOOL)isEmpty {
    return CGPathIsEmpty(_path);
}

- (CGRect)bounds {
    return CGPathGetBoundingBox(_path);
}

- (void)applyTransform:(CGAffineTransform)transform {
    CGMutablePathRef mutablePath = CGPathCreateMutable();
    CGPathAddPath(mutablePath, &transform, _path);
    self.CGPath = mutablePath;
    CGPathRelease(mutablePath);
}

@end

#endif
