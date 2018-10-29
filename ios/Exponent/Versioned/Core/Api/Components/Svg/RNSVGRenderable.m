/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGRenderable.h"
#import "RNSVGClipPath.h"
#import "RNSVGMask.h"
#import "RNSVGViewBox.h"

@implementation RNSVGRenderable
{
    NSMutableDictionary *_originProperties;
    NSArray<NSString *> *_lastMergedList;
    NSArray<NSString *> *_attributeList;
    NSArray<RNSVGLength *> *_sourceStrokeDashArray;
    CGFloat *_strokeDashArrayData;
    CGPathRef _strokePath;
    CGPathRef _hitArea;
}

- (id)init
{
    if (self = [super init]) {
        _fillOpacity = 1;
        _strokeOpacity = 1;
        _strokeWidth = [RNSVGLength lengthWithNumber:1];
        _fillRule = kRNSVGCGFCRuleNonzero;
    }
    return self;
}

- (void)invalidate
{
    _sourceStrokeDashArray = nil;
    [super invalidate];
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

- (void)setStrokeWidth:(RNSVGLength*)strokeWidth
{
    if ([strokeWidth isEqualTo:_strokeWidth]) {
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

- (void)setStrokeDasharray:(NSArray<RNSVGLength *> *)strokeDasharray
{
    if (strokeDasharray == _strokeDasharray) {
        return;
    }
    [self invalidate];
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
    self.path = nil;
    CGPathRelease(_hitArea);
    CGPathRelease(_strokePath);
    _sourceStrokeDashArray = nil;
    if (_strokeDashArrayData) {
        free(_strokeDashArrayData);
    }
    _strokeDashArrayData = nil;
}

UInt32 saturate(CGFloat value) {
    return value <= 0 ? 0 : value >= 255 ? 255 : (UInt32)value;
}

- (void)renderTo:(CGContextRef)context rect:(CGRect)rect
{
    // This needs to be painted on a layer before being composited.
    CGContextSaveGState(context);
    CGContextConcatCTM(context, self.matrix);
    CGContextConcatCTM(context, self.transform);
    CGContextSetAlpha(context, self.opacity);

    [self beginTransparencyLayer:context];

    if (self.mask) {
        // https://www.w3.org/TR/SVG11/masking.html#MaskElement
        RNSVGMask *_maskNode = (RNSVGMask*)[self.svgView getDefinedMask:self.mask];
        CGRect bounds = CGContextGetClipBoundingBox(context);
        CGSize boundsSize = bounds.size;
        CGFloat height = boundsSize.height;
        CGFloat width = boundsSize.width;
        NSUInteger iheight = (NSUInteger)height;
        NSUInteger iwidth = (NSUInteger)width;
        NSUInteger npixels = iheight * iwidth;
        CGRect drawBounds = CGRectMake(0, 0, width, height);

        // Allocate pixel buffer and bitmap context for mask
        NSUInteger bytesPerPixel = 4;
        NSUInteger bitsPerComponent = 8;
        NSUInteger bytesPerRow = bytesPerPixel * iwidth;
        CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
        UInt32 * pixels = (UInt32 *) calloc(npixels, sizeof(UInt32));
        CGContextRef bcontext = CGBitmapContextCreate(pixels, iwidth, iheight, bitsPerComponent, bytesPerRow, colorSpace, kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);

        // Clip to mask bounds and render the mask
        CGFloat x = [self relativeOn:[_maskNode x]
                            relative:width];
        CGFloat y = [self relativeOn:[_maskNode y]
                            relative:height];
        CGFloat w = [self relativeOn:[_maskNode maskwidth]
                            relative:width];
        CGFloat h = [self relativeOn:[_maskNode maskheight]
                            relative:height];
        CGRect maskBounds = CGRectMake(x, y, w, h);
        CGContextClipToRect(bcontext, maskBounds);
        [_maskNode renderLayerTo:bcontext rect:rect];

        // Apply luminanceToAlpha filter primitive
        // https://www.w3.org/TR/SVG11/filters.html#feColorMatrixElement
        UInt32 * currentPixel = pixels;
        for (NSUInteger i = 0; i < npixels; i++) {
            UInt32 color = *currentPixel;

            UInt32 r = color & 0xFF;
            UInt32 g = (color >> 8) & 0xFF;
            UInt32 b = (color >> 16) & 0xFF;

            CGFloat luma = (CGFloat)(0.299 * r + 0.587 * g + 0.144 * b);
            *currentPixel = saturate(luma) << 24;
            currentPixel++;
        }

        // Create mask image and release memory
        CGImageRef maskImage = CGBitmapContextCreateImage(bcontext);
        CGColorSpaceRelease(colorSpace);
        CGContextRelease(bcontext);
        free(pixels);

        // Render content of current SVG Renderable to image
        UIGraphicsBeginImageContextWithOptions(boundsSize, NO, 0.0);
        CGContextRef newContext = UIGraphicsGetCurrentContext();
        CGContextTranslateCTM(newContext, 0.0, height);
        CGContextScaleCTM(newContext, 1.0, -1.0);
        [self renderLayerTo:newContext rect:rect];
        CGImageRef contentImage = CGBitmapContextCreateImage(newContext);
        UIGraphicsEndImageContext();

        // Blend current element and mask
        UIGraphicsBeginImageContextWithOptions(boundsSize, NO, 0.0);
        newContext = UIGraphicsGetCurrentContext();
        CGContextTranslateCTM(newContext, 0.0, height);
        CGContextScaleCTM(newContext, 1.0, -1.0);

        CGContextSetBlendMode(newContext, kCGBlendModeCopy);
        CGContextDrawImage(newContext, drawBounds, maskImage);
        CGImageRelease(maskImage);

        CGContextSetBlendMode(newContext, kCGBlendModeSourceIn);
        CGContextDrawImage(newContext, drawBounds, contentImage);
        CGImageRelease(contentImage);

        CGImageRef blendedImage = CGBitmapContextCreateImage(newContext);
        UIGraphicsEndImageContext();

        // Render blended result into current render context
        CGContextDrawImage(context, drawBounds, blendedImage);
        CGImageRelease(blendedImage);
    } else {
        [self renderLayerTo:context rect:rect];
    }
    [self endTransparencyLayer:context];

    CGContextRestoreGState(context);
}

- (void)prepareStrokeDash:(NSUInteger)count strokeDasharray:(NSArray<RNSVGLength *> *)strokeDasharray {
    if (strokeDasharray != _sourceStrokeDashArray) {
        CGFloat *dash = _strokeDashArrayData;
        _strokeDashArrayData = realloc(dash, sizeof(CGFloat) * count);
        if (!_strokeDashArrayData) {
            free(dash);
            return;
        }
        _sourceStrokeDashArray = strokeDasharray;
        for (NSUInteger i = 0; i < count; i++) {
            _strokeDashArrayData[i] = (CGFloat)[self relativeOnOther:strokeDasharray[i]];
        }
    }
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
    self.bounds = self.clientRect;

    CGPathDrawingMode mode = kCGPathStroke;
    BOOL fillColor = NO;
    [self clip:context];

    BOOL evenodd = self.fillRule == kRNSVGCGFCRuleEvenodd;

    if (self.fill) {
        if (self.fill.class == RNSVGBrush.class) {
            CGContextSetFillColorWithColor(context, [self.tintColor CGColor]);
            fillColor = YES;
        } else {
            fillColor = [self.fill applyFillColor:context opacity:self.fillOpacity];
        }

        if (fillColor) {
            mode = evenodd ? kCGPathEOFill : kCGPathFill;
        } else {
            CGContextSaveGState(context);
            CGContextAddPath(context, self.path);
            CGContextClip(context);
            [self.fill paint:context
                     opacity:self.fillOpacity
                     painter:[self.svgView getDefinedPainter:self.fill.brushRef]
                      bounds:pathBounding
             ];
            CGContextRestoreGState(context);

            if (!self.stroke) {
                return;
            }
        }
    }

    if (self.stroke) {
        CGFloat width = self.strokeWidth ? [self relativeOnOther:self.strokeWidth] : 1;
        CGContextSetLineWidth(context, width);
        CGContextSetLineCap(context, self.strokeLinecap);
        CGContextSetLineJoin(context, self.strokeLinejoin);
        NSArray<RNSVGLength *>* strokeDasharray = self.strokeDasharray;
        NSUInteger count = strokeDasharray.count;

        if (count) {
            [self prepareStrokeDash:count strokeDasharray:strokeDasharray];
            if (_strokeDashArrayData) {
                CGContextSetLineDash(context, self.strokeDashoffset, _strokeDashArrayData, count);
            }
        }

        if (!fillColor) {
            CGContextAddPath(context, self.path);
            CGContextReplacePathWithStrokedPath(context);
            CGContextClip(context);
        }

        BOOL strokeColor;

        if (self.stroke.class == RNSVGBrush.class) {
            CGContextSetStrokeColorWithColor(context,[self.tintColor CGColor]);
            strokeColor = YES;
        } else {
            strokeColor = [self.stroke applyStrokeColor:context opacity:self.strokeOpacity];
        }

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
                        bounds:pathBounding
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
    CGPathRelease(_strokePath);
    _hitArea = CGPathRetain(CFAutorelease(CGPathCreateCopy(path)));
    _strokePath = nil;
    if (self.stroke && self.strokeWidth) {
        // Add stroke to hitArea
        CGFloat width = [self relativeOnOther:self.strokeWidth];
        _strokePath = CGPathRetain(CFAutorelease(CGPathCreateCopyByStrokingPath(path, nil, width, self.strokeLinecap, self.strokeLinejoin, self.strokeMiterlimit)));
        // TODO add dashing
        // CGPathCreateCopyByDashingPath(CGPathRef  _Nullable path, const CGAffineTransform * _Nullable transform, CGFloat phase, const CGFloat * _Nullable lengths, size_t count)
    }
}

// hitTest delegate
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
    transformed = CGPointApplyAffineTransform(transformed, self.invTransform);

    BOOL evenodd = self.fillRule == kRNSVGCGFCRuleEvenodd;
    if (!CGPathContainsPoint(_hitArea, nil, transformed, evenodd) &&
        !CGPathContainsPoint(_strokePath, nil, transformed, NO)) {
        return nil;
    }

    if (self.clipPath) {
        RNSVGClipPath *clipNode = (RNSVGClipPath*)[self.svgView getDefinedClipPath:self.clipPath];
        if ([clipNode isSimpleClipPath]) {
            CGPathRef clipPath = [self getClipPath];
            if (clipPath && !CGPathContainsPoint(clipPath, nil, transformed, clipNode.clipRule == kRNSVGCGFCRuleEvenodd)) {
                return nil;
            }
        } else {
            RNSVGRenderable *clipGroup = (RNSVGRenderable*)clipNode;
            if (![clipGroup hitTest:transformed withEvent:event]) {
                return nil;
            }
        }
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
