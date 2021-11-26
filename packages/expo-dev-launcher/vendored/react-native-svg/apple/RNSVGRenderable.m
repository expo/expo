/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTPointerEvents.h>
#import "RNSVGRenderable.h"
#import "RNSVGClipPath.h"
#import "RNSVGMask.h"
#import "RNSVGViewBox.h"
#import "RNSVGVectorEffect.h"
#import "RNSVGBezierElement.h"
#import "RNSVGMarker.h"
#import "RNSVGMarkerPosition.h"

@implementation RNSVGRenderable
{
    NSMutableDictionary *_originProperties;
    NSArray<NSString *> *_lastMergedList;
    NSArray<NSString *> *_attributeList;
    NSArray<RNSVGLength *> *_sourceStrokeDashArray;
    CGFloat *_strokeDashArrayData;
    CGPathRef _srcHitPath;
}

static RNSVGRenderable * _contextElement;
+ (RNSVGRenderable *)contextElement { return _contextElement; }
+ (void)setContextElement:(RNSVGRenderable *)contextElement { _contextElement = contextElement; }

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
    if (self.dirty || self.merging) {
        return;
    }
    _srcHitPath = nil;
    [super invalidate];
    self.dirty = true;
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

- (void)setVectorEffect:(RNSVGVectorEffect)vectorEffect
{
    if (vectorEffect == _vectorEffect) {
        return;
    }
    [self invalidate];
    _vectorEffect = vectorEffect;
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
    self.dirty = false;
    // This needs to be painted on a layer before being composited.
    CGContextSaveGState(context);
    CGContextConcatCTM(context, self.matrix);
    CGContextConcatCTM(context, self.transforms);
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

    [self renderMarkers:context path:self.path rect:&rect];
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

- (void)renderMarkers:(CGContextRef)context path:(CGPathRef)path rect:(const CGRect *)rect {
    RNSVGMarker *markerStart = (RNSVGMarker*)[self.svgView getDefinedMarker:self.markerStart];
    RNSVGMarker *markerMid = (RNSVGMarker*)[self.svgView getDefinedMarker:self.markerMid];
    RNSVGMarker *markerEnd = (RNSVGMarker*)[self.svgView getDefinedMarker:self.markerEnd];
    if (markerStart || markerMid || markerEnd) {
        _contextElement = self;
        NSArray<RNSVGMarkerPosition*>* positions = [RNSVGMarkerPosition fromCGPath:path];
        CGFloat width = self.strokeWidth ? [self relativeOnOther:self.strokeWidth] : 1;
        __block CGRect bounds = CGRectNull;
        CGMutablePathRef markerPath = CGPathCreateMutable();
        for (RNSVGMarkerPosition* position in positions) {
            RNSVGMarkerType type = [position type];
            RNSVGMarker *marker;
            switch (type) {
                case kStartMarker:
                    marker = markerStart;
                    break;

                case kMidMarker:
                    marker = markerMid;
                    break;

                case kEndMarker:
                    marker = markerEnd;
                    break;
            }
            if (!marker) {
                continue;
            }

            [marker renderMarker:context rect:*rect position:position strokeWidth:width];
            CGAffineTransform transform = marker.transform;
            CGPathRef hitArea = marker.hitArea;
            CGPathAddPath(markerPath, &transform, hitArea);
            CGRect nodeRect = marker.pathBounds;
            if (!CGRectIsEmpty(nodeRect)) {
                bounds = CGRectUnion(bounds, CGRectApplyAffineTransform(nodeRect, transform));
            }
        }
        self.markerBounds = bounds;
        self.markerPath = markerPath;
        _contextElement = nil;
    }
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
    CGPathRef path = self.path;
    if (!path) {
        path = [self getPath:context];
        if (!self.path) {
            self.path = CGPathRetain(path);
        }
        [self setHitArea:path];
        self.fillBounds = CGPathGetBoundingBox(path);
        self.strokeBounds = CGPathGetBoundingBox(self.strokePath);
        self.pathBounds = CGRectUnion(self.fillBounds, self.strokeBounds);
    }
    const CGRect pathBounds = self.pathBounds;

    CGAffineTransform current = CGContextGetCTM(context);
    CGAffineTransform svgToClientTransform = CGAffineTransformConcat(current, self.svgView.invInitialCTM);
    CGRect clientRect = CGRectApplyAffineTransform(pathBounds, svgToClientTransform);

    self.ctm = svgToClientTransform;
    self.clientRect = clientRect;
    self.screenCTM = current;

    if (_vectorEffect == kRNSVGVectorEffectNonScalingStroke) {
        path = CGPathCreateCopyByTransformingPath(path, &svgToClientTransform);
        CGContextConcatCTM(context, CGAffineTransformInvert(svgToClientTransform));
    }

    CGAffineTransform vbmatrix = self.svgView.getViewBoxTransform;
    CGAffineTransform transform = CGAffineTransformConcat(self.matrix, self.transforms);
    CGAffineTransform matrix = CGAffineTransformConcat(transform, vbmatrix);

    CGRect bounds = CGRectMake(0, 0, CGRectGetWidth(clientRect), CGRectGetHeight(clientRect));
    CGPoint mid = CGPointMake(CGRectGetMidX(pathBounds), CGRectGetMidY(pathBounds));
    CGPoint center = CGPointApplyAffineTransform(mid, matrix);

    self.bounds = bounds;
    if (!isnan(center.x) && !isnan(center.y)) {
        self.center = center;
    }
    self.frame = clientRect;

    if (self.skip || self.opacity == 0) {
        return;
    }

    if (!self.fill && !self.stroke) {
        return;
    }

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
            CGContextAddPath(context, path);
            evenodd ? CGContextEOClip(context) : CGContextClip(context);
            [self.fill paint:context
                     opacity:self.fillOpacity
                     painter:[self.svgView getDefinedPainter:self.fill.brushRef]
                      bounds:pathBounds
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
            CGContextAddPath(context, path);
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
                CGContextAddPath(context, path);
                CGContextDrawPath(context, mode);
            }

            // draw stroke
            CGContextAddPath(context, path);
            CGContextReplacePathWithStrokedPath(context);
            evenodd ? CGContextEOClip(context) : CGContextClip(context);

            [self.stroke paint:context
                       opacity:self.strokeOpacity
                       painter:[self.svgView getDefinedPainter:self.stroke.brushRef]
                        bounds:pathBounds
             ];
            return;
        }
    }

    CGContextAddPath(context, path);
    CGContextDrawPath(context, mode);
}

- (void)setHitArea:(CGPathRef)path
{
    if (_srcHitPath == path) {
        return;
    }
    _srcHitPath = path;
    CGPathRelease(_hitArea);
    CGPathRelease(self.strokePath);
    _hitArea = CGPathCreateCopy(path);
    self.strokePath = nil;
    if (self.stroke && self.strokeWidth) {
        // Add stroke to hitArea
        CGFloat width = [self relativeOnOther:self.strokeWidth];
        self.strokePath = CGPathRetain(CFAutorelease(CGPathCreateCopyByStrokingPath(path, nil, width, self.strokeLinecap, self.strokeLinejoin, self.strokeMiterlimit)));
        // TODO add dashing
        // CGPathCreateCopyByDashingPath(CGPathRef  _Nullable path, const CGAffineTransform * _Nullable transform, CGFloat phase, const CGFloat * _Nullable lengths, size_t count)
    }
}

- (BOOL)isUserInteractionEnabled
{
    return NO;
}

// hitTest delegate
- (RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    if (!_hitArea) {
        return nil;
    }

    BOOL canReceiveTouchEvents = (self.pointerEvents != RCTPointerEventsNone && ![self isHidden]);
    if(!canReceiveTouchEvents) {
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

    if (!CGRectContainsPoint(self.pathBounds, transformed) &&
        !CGRectContainsPoint(self.markerBounds, transformed)) {
        return nil;
    }

    BOOL evenodd = self.fillRule == kRNSVGCGFCRuleEvenodd;
    if (!CGPathContainsPoint(_hitArea, nil, transformed, evenodd) &&
        !CGPathContainsPoint(self.strokePath, nil, transformed, NO) &&
        !CGPathContainsPoint(self.markerPath, nil, transformed, NO)) {
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
    self.merging = true;

    NSMutableArray* attributeList = self.propList ? [self.propList mutableCopy] : [[NSMutableArray alloc] init];
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
    self.merging = false;
}

- (void)resetProperties
{
    self.merging = true;
    for (NSString *key in _lastMergedList) {
        [self setValue:[_originProperties valueForKey:key] forKey:key];
    }

    _lastMergedList = nil;
    _attributeList = _propList;
    self.merging = false;
}

@end
