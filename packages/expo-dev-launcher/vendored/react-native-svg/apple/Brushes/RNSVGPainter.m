/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGPainter.h"
#import "RNSVGPattern.h"
#import "RNSVGViewBox.h"

@implementation RNSVGPainter
{
    NSArray<RNSVGLength *> *_points;
    NSArray<NSNumber *> *_colors;
    RNSVGBrushType _type;
    BOOL _useObjectBoundingBox;
    BOOL _useContentObjectBoundingBox;
    CGAffineTransform _transform;
    CGRect _userSpaceBoundingBox;
}

- (instancetype)initWithPointsArray:(NSArray<RNSVGLength *> *)pointsArray
{
    if ((self = [super init])) {
        _points = pointsArray;
    }
    return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)setUnits:(RNSVGUnits)unit
{
    _useObjectBoundingBox = unit == kRNSVGUnitsObjectBoundingBox;
}

- (void)setContentUnits:(RNSVGUnits)unit
{
    _useContentObjectBoundingBox = unit == kRNSVGUnitsObjectBoundingBox;
}

- (void)setUserSpaceBoundingBox:(CGRect)userSpaceBoundingBox
{
    _userSpaceBoundingBox = userSpaceBoundingBox;
}

- (void)setTransform:(CGAffineTransform)transform
{
    _transform = transform;
}

- (void)setPattern:(RNSVGPattern *)pattern
{
    if (_type != kRNSVGUndefinedType) {
        // todo: throw error
        return;
    }

    _type = kRNSVGPattern;
    _pattern = pattern;
}

- (void)setLinearGradientColors:(NSArray<NSNumber *> *)colors
{
    if (_type != kRNSVGUndefinedType) {
        // todo: throw error
        return;
    }

    _type = kRNSVGLinearGradient;
    _colors = colors;
}

- (void)setRadialGradientColors:(NSArray<NSNumber *> *)colors
{
    if (_type != kRNSVGUndefinedType) {
        // todo: throw error
        return;
    }

    _type = kRNSVGRadialGradient;
    _colors = colors;
}

- (void)paint:(CGContextRef)context bounds:(CGRect)bounds
{
    if (_type == kRNSVGLinearGradient) {
        [self paintLinearGradient:context bounds:bounds];
    } else if (_type == kRNSVGRadialGradient) {
        [self paintRadialGradient:context bounds:bounds];
    } else if (_type == kRNSVGPattern) {
        [self paintPattern:context bounds:bounds];
    }
}

- (CGRect)getPaintRect:(CGContextRef)context bounds:(CGRect)bounds
{
    CGRect rect = _useObjectBoundingBox ? bounds : _userSpaceBoundingBox;
    CGFloat height = CGRectGetHeight(rect);
    CGFloat width = CGRectGetWidth(rect);
    CGFloat x = 0.0;
    CGFloat y = 0.0;

    if (_useObjectBoundingBox) {
        x = CGRectGetMinX(rect);
        y = CGRectGetMinY(rect);
    }

    return CGRectMake(x, y, width, height);
}

void PatternFunction(void* info, CGContextRef context)
{
    RNSVGPainter *_painter = (__bridge RNSVGPainter *)info;
    RNSVGPattern *_pattern = [_painter pattern];
    CGRect rect = _painter.paintBounds;
    CGFloat minX = _pattern.minX;
    CGFloat minY = _pattern.minY;
    CGFloat vbWidth = _pattern.vbWidth;
    CGFloat vbHeight = _pattern.vbHeight;
    if (vbWidth > 0 && vbHeight > 0) {
        CGRect vbRect = CGRectMake(minX, minY, vbWidth, vbHeight);
        CGAffineTransform _viewBoxTransform = [RNSVGViewBox
                                               getTransform:vbRect
                                               eRect:rect
                                               align:_pattern.align
                                               meetOrSlice:_pattern.meetOrSlice];
        CGContextConcatCTM(context, _viewBoxTransform);
    }

    if (_painter.useObjectBoundingBoxForContentUnits) {
        CGRect bounds = _painter.bounds;
        CGContextConcatCTM(context, CGAffineTransformMakeScale(bounds.size.width, bounds.size.height));
    }

    [_pattern renderTo:context rect:rect];
}

- (CGFloat)getVal:(RNSVGLength*)length relative:(CGFloat)relative
{
    RNSVGLengthUnitType unit = [length unit];
    CGFloat val = [RNSVGPropHelper fromRelative:length
                                       relative:relative];
    return _useObjectBoundingBox &&
        unit == SVG_LENGTHTYPE_NUMBER ? val * relative : val;
}

- (void)paintPattern:(CGContextRef)context bounds:(CGRect)bounds
{
    CGRect rect = [self getPaintRect:context bounds:bounds];
    CGFloat height = CGRectGetHeight(rect);
    CGFloat width = CGRectGetWidth(rect);

    CGFloat x = [self getVal:[_points objectAtIndex:0] relative:width];
    CGFloat y = [self getVal:[_points objectAtIndex:1] relative:height];
    CGFloat w = [self getVal:[_points objectAtIndex:2] relative:width];
    CGFloat h = [self getVal:[_points objectAtIndex:3] relative:height];

    CGAffineTransform viewbox = [self.pattern.svgView getViewBoxTransform];
#if TARGET_OS_OSX
    // This is needed because macOS and iOS have different conventions for where the origin is.
    // For macOS, it's in the bottom-left corner. For iOS, it's in the top-left corner.
    viewbox = CGAffineTransformScale(viewbox, 1, -1);
#endif
    CGRect newBounds = CGRectMake(x, y, w, h);
    CGSize size = newBounds.size;
    self.useObjectBoundingBoxForContentUnits = _useContentObjectBoundingBox;
    self.paintBounds = newBounds;
    self.bounds = rect;

    const CGPatternCallbacks callbacks = { 0, &PatternFunction, NULL };
    CGColorSpaceRef patternSpace = CGColorSpaceCreatePattern(NULL);
    CGContextSetFillColorSpace(context, patternSpace);
    CGColorSpaceRelease(patternSpace);

    CGPatternRef pattern = CGPatternCreate((__bridge void * _Nullable)(self),
                                           newBounds,
                                           viewbox,
                                           size.width,
                                           size.height,
                                           kCGPatternTilingConstantSpacing,
                                           true,
                                           &callbacks);
    CGFloat alpha = 1.0;
    CGContextSetFillPattern(context, pattern, &alpha);
    CGPatternRelease(pattern);

    CGContextFillRect(context, bounds);
}

- (void)paintLinearGradient:(CGContextRef)context bounds:(CGRect)bounds
{
    if ([_colors count] == 0) {
        RCTLogWarn(@"No stops in gradient");
        return;
    }
    CGGradientRef gradient = CGGradientRetain([RCTConvert RNSVGCGGradient:_colors]);
    CGGradientDrawingOptions extendOptions = kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation;

    CGRect rect = [self getPaintRect:context bounds:bounds];
    CGFloat height = CGRectGetHeight(rect);
    CGFloat width = CGRectGetWidth(rect);
    CGFloat offsetX = CGRectGetMinX(rect);
    CGFloat offsetY = CGRectGetMinY(rect);

    CGFloat x1 = [self getVal:[_points objectAtIndex:0] relative:width] + offsetX;
    CGFloat y1 = [self getVal:[_points objectAtIndex:1] relative:height] + offsetY;
    CGFloat x2 = [self getVal:[_points objectAtIndex:2] relative:width] + offsetX;
    CGFloat y2 = [self getVal:[_points objectAtIndex:3] relative:height] + offsetY;

    CGContextConcatCTM(context, _transform);
    CGContextDrawLinearGradient(context, gradient, CGPointMake(x1, y1), CGPointMake(x2, y2), extendOptions);
    CGGradientRelease(gradient);
}

- (void)paintRadialGradient:(CGContextRef)context bounds:(CGRect)bounds
{
    if ([_colors count] == 0) {
        RCTLogWarn(@"No stops in gradient");
        return;
    }
    CGGradientRef gradient = CGGradientRetain([RCTConvert RNSVGCGGradient:_colors]);
    CGGradientDrawingOptions extendOptions = kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation;

    CGRect rect = [self getPaintRect:context bounds:bounds];

    CGFloat width = CGRectGetWidth(rect);
    CGFloat height = CGRectGetHeight(rect);

    CGFloat offsetX = CGRectGetMinX(rect);
    CGFloat offsetY = CGRectGetMinY(rect);

    CGFloat rx = [self getVal:[_points objectAtIndex:2] relative:width];
    CGFloat ry = [self getVal:[_points objectAtIndex:3] relative:height];

    double ratio = ry / rx;

    CGFloat fx = [self getVal:[_points objectAtIndex:0] relative:width] + offsetX;
    CGFloat fy = ([self getVal:[_points objectAtIndex:1] relative:height] + offsetY) / ratio;

    CGFloat cx = [self getVal:[_points objectAtIndex:4] relative:width] + offsetX;
    CGFloat cy = ([self getVal:[_points objectAtIndex:5] relative:height] + offsetY) / ratio;

    CGAffineTransform transform = CGAffineTransformMakeScale(1, ratio);
    CGContextConcatCTM(context, transform);

    CGContextConcatCTM(context, _transform);
    CGContextDrawRadialGradient(context, gradient, CGPointMake(fx, fy), 0, CGPointMake(cx, cy), rx, extendOptions);
    CGGradientRelease(gradient);
}

@end

