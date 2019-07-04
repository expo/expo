/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RNSVGPainter.h"
#import "ABI31_0_0RNSVGPattern.h"
#import "ABI31_0_0RNSVGPercentageConverter.h"
#import "ABI31_0_0RNSVGViewBox.h"

@implementation ABI31_0_0RNSVGPainter
{
    NSArray<ABI31_0_0RNSVGLength *> *_points;
    NSArray<NSNumber *> *_colors;
    ABI31_0_0RNSVGBrushType _type;
    BOOL _useObjectBoundingBox;
    BOOL _useContentObjectBoundingBox;
    CGAffineTransform _transform;
    CGRect _userSpaceBoundingBox;
}

- (instancetype)initWithPointsArray:(NSArray<ABI31_0_0RNSVGLength *> *)pointsArray
{
    if ((self = [super init])) {
        _points = pointsArray;
    }
    return self;
}

ABI31_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)setUnits:(ABI31_0_0RNSVGUnits)unit
{
    _useObjectBoundingBox = unit == kRNSVGUnitsObjectBoundingBox;
}

- (void)setContentUnits:(ABI31_0_0RNSVGUnits)unit
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

- (void)setPattern:(ABI31_0_0RNSVGPattern *)pattern
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

void ABI31_0_0PatternFunction(void* info, CGContextRef context)
{
    ABI31_0_0RNSVGPainter *_painter = (__bridge ABI31_0_0RNSVGPainter *)info;
    ABI31_0_0RNSVGPattern *_pattern = [_painter pattern];
    CGRect rect = _painter.paintBounds;

    CGAffineTransform _viewBoxTransform = [ABI31_0_0RNSVGViewBox getTransform:CGRectMake(_pattern.minX, _pattern.minY, _pattern.vbWidth, _pattern.vbHeight)
                                             eRect:rect
                                             align:_pattern.align
                                       meetOrSlice:_pattern.meetOrSlice];
    CGContextConcatCTM(context, _viewBoxTransform);

    [_pattern renderTo:context rect:rect];
}

- (void)paintPattern:(CGContextRef)context bounds:(CGRect)bounds
{
    CGRect rect = [self getPaintRect:context bounds:bounds];
    CGFloat height = CGRectGetHeight(rect);
    CGFloat width = CGRectGetWidth(rect);
    CGFloat offsetX = CGRectGetMinX(rect);
    CGFloat offsetY = CGRectGetMinY(rect);

    CGFloat x = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:0]
                                                relative:width
                                                  offset:offsetX];
    CGFloat y = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:1]
                                                relative:height
                                                  offset:offsetY];
    CGFloat w = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:2]
                                                relative:width
                                                  offset:offsetX];
    CGFloat h = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:3]
                                                relative:height
                                                  offset:offsetY];

    CGAffineTransform viewbox = [self.pattern.svgView getViewBoxTransform];
    CGRect newBounds = CGRectApplyAffineTransform(CGRectMake(x, y, w, h), viewbox);
    CGSize size = newBounds.size;
    self.paintBounds = newBounds;

    const CGPatternCallbacks callbacks = { 0, &ABI31_0_0PatternFunction, NULL };
    CGColorSpaceRef patternSpace = CGColorSpaceCreatePattern(NULL);
    CGContextSetFillColorSpace(context, patternSpace);
    CGColorSpaceRelease(patternSpace);

    CGPatternRef pattern = CGPatternCreate((__bridge void * _Nullable)(self),
                                           newBounds,
                                           CGAffineTransformIdentity,
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

    CGGradientRef gradient = CGGradientRetain([ABI31_0_0RCTConvert ABI31_0_0RNSVGCGGradient:_colors offset:0]);
    CGGradientDrawingOptions extendOptions = kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation;

    CGRect rect = [self getPaintRect:context bounds:bounds];
    CGFloat height = CGRectGetHeight(rect);
    CGFloat width = CGRectGetWidth(rect);
    CGFloat offsetX = CGRectGetMinX(rect);
    CGFloat offsetY = CGRectGetMinY(rect);

    CGFloat x1 = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:0]
                                                relative:width
                                                  offset:offsetX];
    CGFloat y1 = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:1]
                                                relative:height
                                                  offset:offsetY];
    CGFloat x2 = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:2]
                                                relative:width
                                                  offset:offsetX];
    CGFloat y2 = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:3]
                                                relative:height
                                                  offset:offsetY];


    CGContextConcatCTM(context, _transform);
    CGContextDrawLinearGradient(context, gradient, CGPointMake(x1, y1), CGPointMake(x2, y2), extendOptions);
    CGGradientRelease(gradient);
}

- (void)paintRadialGradient:(CGContextRef)context bounds:(CGRect)bounds
{
    CGGradientRef gradient = CGGradientRetain([ABI31_0_0RCTConvert ABI31_0_0RNSVGCGGradient:_colors offset:0]);
    CGGradientDrawingOptions extendOptions = kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation;

    CGRect rect = [self getPaintRect:context bounds:bounds];
    CGFloat height = CGRectGetHeight(rect);
    CGFloat width = CGRectGetWidth(rect);
    CGFloat offsetX = CGRectGetMinX(rect);
    CGFloat offsetY = CGRectGetMinY(rect);

    CGFloat rx = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:2]
                                                relative:width
                                                  offset:0];
    CGFloat ry = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:3]
                                                relative:height
                                                  offset:0];
    CGFloat fx = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:0]
                                                relative:width
                                                  offset:offsetX];
    CGFloat fy = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:1]
                                                relative:height
                                                  offset:offsetY] / (ry / rx);
    CGFloat cx = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:4]
                                                relative:width
                                                  offset:offsetX];
    CGFloat cy = [ABI31_0_0RNSVGPercentageConverter lengthToFloat:[_points objectAtIndex:5]
                                                relative:height
                                                  offset:offsetY] / (ry / rx);

    CGAffineTransform transform = CGAffineTransformMakeScale(1, ry / rx);
    CGContextConcatCTM(context, transform);

    CGContextConcatCTM(context, _transform);
    CGContextDrawRadialGradient(context, gradient, CGPointMake(fx, fy), 0, CGPointMake(cx, cy), rx, extendOptions);
    CGGradientRelease(gradient);
}

@end

