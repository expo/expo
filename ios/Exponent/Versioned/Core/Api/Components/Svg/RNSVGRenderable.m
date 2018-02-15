/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGRenderable.h"

@implementation RNSVGRenderable
{
    NSMutableDictionary *_originProperties;
    NSArray<NSString *> *_lastMergedList;
    NSArray<NSString *> *_attributeList;
    CGPathRef _hitArea;
}

- (id)init
{
    if (self = [super init]) {
        _fillOpacity = 1;
        _strokeOpacity = 1;
        _strokeWidth = @"1";
        _fillRule = kRNSVGCGFCRuleNonzero;
    }
    return self;
}

- (void)setFill:(RNSVGBrush *)fill
{
    if (fill == _fill) {
        return;
    }
    [self invalidate];
    _fill = fill;
}

- (void)setFillOpacity:(CGFloat)fillOpacity
{
    if (fillOpacity == _fillOpacity) {
        return;
    }
    [self invalidate];
    _fillOpacity = fillOpacity;
}

- (void)setFillRule:(RNSVGCGFCRule)fillRule
{
    if (fillRule == _fillRule) {
        return;
    }
    [self invalidate];
    _fillRule = fillRule;
}

- (void)setStroke:(RNSVGBrush *)stroke
{
    if (stroke == _stroke) {
        return;
    }
    [self invalidate];
    _stroke = stroke;
}

- (void)setStrokeOpacity:(CGFloat)strokeOpacity
{
    if (strokeOpacity == _strokeOpacity) {
        return;
    }
    [self invalidate];
    _strokeOpacity = strokeOpacity;
}

- (void)setStrokeWidth:(NSString*)strokeWidth
{
    if (strokeWidth == _strokeWidth) {
        return;
    }
    [self invalidate];
    _strokeWidth = strokeWidth;
}

- (void)setStrokeLinecap:(CGLineCap)strokeLinecap
{
    if (strokeLinecap == _strokeLinecap) {
        return;
    }
    [self invalidate];
    _strokeLinecap = strokeLinecap;
}

- (void)setStrokeJoin:(CGLineJoin)strokeLinejoin
{
    if (strokeLinejoin == _strokeLinejoin) {
        return;
    }
    [self invalidate];
    _strokeLinejoin = strokeLinejoin;
}

- (void)setStrokeMiterlimit:(CGFloat)strokeMiterlimit
{
    if (strokeMiterlimit == _strokeMiterlimit) {
        return;
    }
    [self invalidate];
    _strokeMiterlimit = strokeMiterlimit;
}

- (void)setStrokeDasharray:(NSArray<NSString *> *)strokeDasharray
{
    if (strokeDasharray == _strokeDasharray) {
        return;
    }
    if (_strokeDasharrayData.array) {
        free(_strokeDasharrayData.array);
    }
    [self invalidate];
    NSUInteger count = strokeDasharray.count;
    _strokeDasharrayData.count = count;
    _strokeDasharrayData.array = nil;

    if (count) {
        _strokeDasharrayData.array = malloc(sizeof(CGFloat) * count);
        for (NSUInteger i = 0; i < count; i++) {
            _strokeDasharrayData.array[i] = [strokeDasharray[i] floatValue];
        }
    }
    _strokeDasharray = strokeDasharray;
}

- (void)setStrokeDashoffset:(CGFloat)strokeDashoffset
{
    if (strokeDashoffset == _strokeDashoffset) {
        return;
    }
    [self invalidate];
    _strokeDashoffset = strokeDashoffset;
}

- (void)setPropList:(NSArray<NSString *> *)propList
{
    if (propList == _propList) {
        return;
    }

    _propList = _attributeList = propList;
    [self invalidate];
}

- (void)dealloc
{
    CGPathRelease(_hitArea);
    if (_strokeDasharrayData.array) {
        free(_strokeDasharrayData.array);
    }
}

- (void)renderTo:(CGContextRef)context
{
    // This needs to be painted on a layer before being composited.
    CGContextSaveGState(context);
    CGContextConcatCTM(context, self.matrix);
    CGContextSetAlpha(context, self.opacity);

    [self beginTransparencyLayer:context];
    [self renderLayerTo:context];
    [self endTransparencyLayer:context];

    CGContextRestoreGState(context);
}


- (void)renderLayerTo:(CGContextRef)context
{
    if (!self.fill && !self.stroke) {
        return;
    }

    CGPathRef path = [self getPath:context];
    [self setHitArea:path];

    if (self.opacity == 0) {
        return;
    }

    CGPathDrawingMode mode = kCGPathStroke;
    BOOL fillColor = NO;
    [self clip:context];

    BOOL evenodd = self.fillRule == kRNSVGCGFCRuleEvenodd;

    if (self.fill) {
        fillColor = [self.fill applyFillColor:context opacity:self.fillOpacity];

        if (fillColor) {
            mode = evenodd ? kCGPathEOFill : kCGPathFill;
        } else {
            CGContextSaveGState(context);
            CGContextAddPath(context, path);
            CGContextClip(context);
            [self.fill paint:context
                     opacity:self.fillOpacity
                     painter:[[self getSvgView] getDefinedPainter:self.fill.brushRef]
             ];
            CGContextRestoreGState(context);

            if (!self.stroke) {
                return;
            }
        }
    }

    if (self.stroke) {
        CGFloat width = [self relativeOnOther:self.strokeWidth];
        CGContextSetLineWidth(context, width);
        CGContextSetLineCap(context, self.strokeLinecap);
        CGContextSetLineJoin(context, self.strokeLinejoin);
        RNSVGCGFloatArray dash = self.strokeDasharrayData;

        if (dash.count) {
            CGContextSetLineDash(context, self.strokeDashoffset, dash.array, dash.count);
        }

        if (!fillColor) {
            CGContextAddPath(context, path);
            CGContextReplacePathWithStrokedPath(context);
            CGContextClip(context);
        }

        BOOL strokeColor = [self.stroke applyStrokeColor:context opacity:self.strokeOpacity];

        if (strokeColor && fillColor) {
            mode = evenodd ? kCGPathEOFillStroke : kCGPathFillStroke;
        } else if (!strokeColor) {
            // draw fill
            if (fillColor) {
                CGContextAddPath(context, path);
                CGContextDrawPath(context, mode);
            }

            // draw stroke
            CGContextAddPath(context, path);
            CGContextReplacePathWithStrokedPath(context);
            CGContextClip(context);

            [self.stroke paint:context
                       opacity:self.strokeOpacity
                       painter:[[self getSvgView] getDefinedPainter:self.stroke.brushRef]
             ];
            return;
        }
    }

    CGContextAddPath(context, path);
    CGContextDrawPath(context, mode);
}

- (void)setHitArea:(CGPathRef)path
{
    CGPathRelease(_hitArea);
    if (self.responsible) {
        // Add path to hitArea
        CGMutablePathRef hitArea = CGPathCreateMutableCopy(path);

        if (self.stroke && self.strokeWidth) {
            // Add stroke to hitArea
            CGFloat width = [self relativeOnOther:self.strokeWidth];
            CGPathRef strokePath = CGPathCreateCopyByStrokingPath(hitArea, nil, width, self.strokeLinecap, self.strokeLinejoin, self.strokeMiterlimit);
            CGPathAddPath(hitArea, nil, strokePath);
            CGPathRelease(strokePath);
        }

        _hitArea = CGPathRetain(CFAutorelease(CGPathCreateCopy(hitArea)));
        CGPathRelease(hitArea);
    }

}

// hitTest delagate
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return [self hitTest:point withEvent:event withTransform:CGAffineTransformIdentity];
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event withTransform:(CGAffineTransform)transform
{
    if (!_hitArea) {
        return nil;
    }

    if (self.active) {
        if (!event) {
            self.active = NO;
        }
        return self;
    }

    CGAffineTransform matrix = CGAffineTransformConcat(self.matrix, transform);
    CGPathRef hitArea = CGPathCreateCopyByTransformingPath(_hitArea, &matrix);
    BOOL contains = CGPathContainsPoint(hitArea, nil, point, NO);
    CGPathRelease(hitArea);

    if (contains) {
        CGPathRef clipPath = [self getClipPath];

        if (!clipPath) {
            return self;
        } else {
            CGPathRef transformedClipPath = CGPathCreateCopyByTransformingPath(clipPath, &matrix);
            BOOL result = CGPathContainsPoint(transformedClipPath, nil, point, self.clipRule == kRNSVGCGFCRuleEvenodd);
            CGPathRelease(transformedClipPath);
            return result ? self : nil;
        }
    } else {
        return nil;
    }
}

- (NSArray<NSString *> *)getAttributeList
{
    return _attributeList;
}

- (void)mergeProperties:(__kindof RNSVGRenderable *)target
{
    NSArray<NSString *> *targetAttributeList = [target getAttributeList];

    if (targetAttributeList.count == 0) {
        return;
    }

    NSMutableArray* attributeList = [self.propList mutableCopy];
    _originProperties = [[NSMutableDictionary alloc] init];

    for (NSString *key in targetAttributeList) {
        [_originProperties setValue:[self valueForKey:key] forKey:key];
        if (![attributeList containsObject:key]) {
            [attributeList addObject:key];
            [self setValue:[target valueForKey:key] forKey:key];
        }
    }

    _lastMergedList = targetAttributeList;
    _attributeList = [attributeList copy];
}

- (void)resetProperties
{
    for (NSString *key in _lastMergedList) {
        [self setValue:[_originProperties valueForKey:key] forKey:key];
    }

    _lastMergedList = nil;
    _attributeList = _propList;
}

@end
