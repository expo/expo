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
    CGPathRelease(self.path);
    CGPathRelease(_hitArea);
    if (_strokeDasharrayData.array) {
        free(_strokeDasharrayData.array);
    }
}

- (void)renderTo:(CGContextRef)context rect:(CGRect)rect
{
    // This needs to be painted on a layer before being composited.
    CGContextSaveGState(context);
    CGContextConcatCTM(context, self.matrix);
    CGContextSetAlpha(context, self.opacity);

    [self beginTransparencyLayer:context];
    [self renderLayerTo:context rect:rect];
    [self endTransparencyLayer:context];

    CGContextRestoreGState(context);
}


- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
    if (!self.fill && !self.stroke) {
        return;
    }

    if (self.opacity == 0) {
        return;
    }

    if (!self.path) {
        self.path = CGPathRetain(CFAutorelease(CGPathCreateCopy([self getPath:context])));
        [self setHitArea:self.path];
    }
    
    const CGRect pathBounding = CGPathGetBoundingBox(self.path);
    const CGAffineTransform svgToClientTransform = CGAffineTransformConcat(CGContextGetCTM(context), self.svgView.invInitialCTM);
    self.clientRect = CGRectApplyAffineTransform(pathBounding, svgToClientTransform);

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
            CGContextAddPath(context, self.path);
            CGContextClip(context);
            [self.fill paint:context
                     opacity:self.fillOpacity
                     painter:[self.svgView getDefinedPainter:self.fill.brushRef]
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
            CGContextAddPath(context, self.path);
            CGContextReplacePathWithStrokedPath(context);
            CGContextClip(context);
        }

        BOOL strokeColor = [self.stroke applyStrokeColor:context opacity:self.strokeOpacity];

        if (strokeColor && fillColor) {
            mode = evenodd ? kCGPathEOFillStroke : kCGPathFillStroke;
        } else if (!strokeColor) {
            // draw fill
            if (fillColor) {
                CGContextAddPath(context, self.path);
                CGContextDrawPath(context, mode);
            }

            // draw stroke
            CGContextAddPath(context, self.path);
            CGContextReplacePathWithStrokedPath(context);
            CGContextClip(context);

            [self.stroke paint:context
                       opacity:self.strokeOpacity
                       painter:[self.svgView getDefinedPainter:self.stroke.brushRef]
             ];
            return;
        }
    }

    CGContextAddPath(context, self.path);
    CGContextDrawPath(context, mode);
}

- (void)setHitArea:(CGPathRef)path
{
    CGPathRelease(_hitArea);
    _hitArea = nil;
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

// hitTest delagate
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
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

    CGPoint transformed = CGPointApplyAffineTransform(point, self.invmatrix);

    if (!CGPathContainsPoint(_hitArea, nil, transformed, NO)) {
        return nil;
    }

    CGPathRef clipPath = [self getClipPath];
    if (clipPath && !CGPathContainsPoint(clipPath, nil, transformed, self.clipRule == kRNSVGCGFCRuleEvenodd)) {
        return nil;
    }

    return self;
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
