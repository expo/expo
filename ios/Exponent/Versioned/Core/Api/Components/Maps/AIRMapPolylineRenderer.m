//
//  AIRMapPolylineRenderer.h
//  mapDemo
//
//  Created by IjzerenHein on 13-11-21.
//  Copyright (c) 2017 IjzerenHein. All rights reserved.
//

#import "AIRMapPolylineRenderer.h"

@interface AIRMapPolylineRendererSegment : NSObject
- (id)initWithPoint:(CGPoint)point color:(UIColor*)color;
- (void) addPoint:(CGPoint)point color:(UIColor*)color;
@property CGMutablePathRef path;
@property UIColor *startColor;
@property UIColor *endColor;
@property CGPoint startPoint;
@property CGPoint endPoint;
@end
@implementation AIRMapPolylineRendererSegment
- (id)initWithPoint:(CGPoint)point color:(UIColor*)color
{
    self = [super init];
    if (self){
        self.path = CGPathCreateMutable();
        self.startColor = color;
        self.startPoint = point;
        self.endPoint = point;
        CGPathMoveToPoint(self.path, nil, point.x, point.y);
    }
    return self;
}
- (void) addPoint:(CGPoint)point color:(UIColor*)color
{
    self.endPoint = point;
    self.endColor = color;
    CGPathAddLineToPoint(self.path, nil, point.x, point.y);
}
@end

@implementation AIRMapPolylineRenderer {
    MKPolyline* _polyline;
    NSArray<UIColor *> *_strokeColors;
    MKMapSnapshot* _snapshot;
    CLLocationCoordinate2D* _coordinates;
}

@synthesize strokeColors;

- (id)initWithOverlay:(id<MKOverlay>)overlay polyline:(MKPolyline*)polyline
{
    self = [super initWithOverlay:overlay];
    if (self){
        _polyline = polyline;
        [self createPath];
    }
    return self;
}

- (id)initWithSnapshot:(MKMapSnapshot*)snapshot overlay:(id<MKOverlay>)overlay polyline:(MKPolyline*)polyline
{
    self = [super initWithOverlay:overlay];
    if (self){
        _snapshot = snapshot;
        _polyline = polyline;
        _coordinates = malloc(sizeof(CLLocationCoordinate2D) * [_polyline pointCount]);
        [_polyline getCoordinates:_coordinates range:NSMakeRange(0, [_polyline pointCount])];
    }
    return self;
}

- (void) dealloc
{
    if (_coordinates) free(_coordinates);
}

- (CGPoint) pointForIndex:(NSUInteger)index
{
    if (_snapshot != nil) {
        return [_snapshot pointForCoordinate:_coordinates[index]];
    }
    else {
        return [self pointForMapPoint:_polyline.points[index]];
    }
}

- (UIColor*) colorForIndex:(NSUInteger)index
{
    if ((_strokeColors == nil) || !_strokeColors.count) return self.strokeColor;
    index = MIN(index, _strokeColors.count - 1);
    UIColor* color = _strokeColors[index];
    CGFloat pc_r,pc_g,pc_b,pc_a;
    [color getRed:&pc_r green:&pc_g blue:&pc_b alpha:&pc_a];
    return (pc_a == 0) ? nil : color;
}

- (void) createPath
{
    CGMutablePathRef path = CGPathCreateMutable();
    BOOL first = YES;
    for (NSUInteger i = 0, n = _polyline.pointCount; i < n; i++){
        CGPoint point = [self pointForIndex:i];
        if (first) {
            CGPathMoveToPoint(path, nil, point.x, point.y);
            first = NO;
        } else {
            CGPathAddLineToPoint(path, nil, point.x, point.y);
        }
    }
    self.path = path;
}

- (NSArray*) createSegments
{
    NSMutableArray* segments = [NSMutableArray new];
    if (_polyline.pointCount <= 1) return segments;
    AIRMapPolylineRendererSegment* segment = nil;
    for (NSUInteger i = 0, n = _polyline.pointCount; i < n; i++){
        CGPoint point = [self pointForIndex:i];
        UIColor* color = [self colorForIndex:i];
        if (segment == nil) {
            
            // Start new segment
            segment = [[AIRMapPolylineRendererSegment alloc] initWithPoint:point color:color];
            [segments addObject:segment];
        }
        else if (((color == nil) && (segment.endColor == nil)) ||
                 ((color != nil) && [segment.startColor isEqual:color])) {
            
            // Append point to segment
            [segment addPoint:point color: color];
        }
        else {
            
            // Close the last segment if needed
            if (segment.endColor == nil) {
                [segment addPoint:point color:color];
            }
            else {
                
                // Add transition gradient
                segment = [[AIRMapPolylineRendererSegment alloc] initWithPoint:segment.endPoint color:segment.endColor];
                [segment addPoint:point color:color];
                [segments addObject:segment];
            }
            
            // Start new segment
            if (i < (n - 1)) {
                segment = [[AIRMapPolylineRendererSegment alloc] initWithPoint:point color:color];
                [segments addObject:segment];
            }
        }
    }
    
    // Remove last segment in case it only contains a single path point
    if ((segment != nil) && (segment.endColor == nil)) {
        [segments removeLastObject];
    }
    
    return segments;
}

- (void) setStrokeColors:(NSArray<UIColor *> *)strokeColors
{
    if (_strokeColors != strokeColors) {
        _strokeColors = strokeColors;
    }
}

- (void) setStrokeColor:(UIColor *)strokeColor
{
    if (super.strokeColor != strokeColor) {
        super.strokeColor = strokeColor;
    }
}

- (void) drawMapRect:(MKMapRect)mapRect zoomScale:(MKZoomScale)zoomScale inContext:(CGContextRef)context
{
    CGRect pointsRect = CGPathGetBoundingBox(self.path);
    CGRect mapRectCG = [self rectForMapRect:mapRect];
    if (!CGRectIntersectsRect(pointsRect, mapRectCG)) return;
    
    [self drawWithZoomScale:zoomScale inContext:context];
}

- (void) drawWithZoomScale:(MKZoomScale)zoomScale inContext:(CGContextRef)context
{
    CGFloat lineWidth = (self.lineWidth / zoomScale) * 2.0;
    CGContextSetLineWidth(context, lineWidth);
    CGContextSetLineCap(context, self.lineCap);
    CGContextSetLineJoin(context, self.lineJoin);
    CGContextSetFillColorWithColor(context, self.fillColor.CGColor);
    CGContextSetMiterLimit(context, self.miterLimit);
    CGFloat dashes[self.lineDashPattern.count];
    for (NSUInteger i = 0; i < self.lineDashPattern.count; i++) {
        dashes[i] = self.lineDashPattern[i].floatValue;
    }
    CGContextSetLineDash(context, self.lineDashPhase, dashes, self.lineDashPattern.count);
    
    NSArray* segments = [self createSegments];
    for (NSUInteger i = 0, n = segments.count; i < n; i++) {
        AIRMapPolylineRendererSegment* segment = segments[i];
        
        CGContextBeginPath(context);
        CGContextAddPath(context, segment.path);
        
        // When segment has two colors, draw it as a gradient
        if (![segment.startColor isEqual:segment.endColor]) {
            CGFloat pc_r,pc_g,pc_b,pc_a,
            cc_r,cc_g,cc_b,cc_a;
            [segment.startColor getRed:&pc_r green:&pc_g blue:&pc_b alpha:&pc_a];
            [segment.endColor getRed:&cc_r green:&cc_g blue:&cc_b alpha:&cc_a];
            CGFloat gradientColors[8] = {pc_r,pc_g,pc_b,pc_a,
                cc_r,cc_g,cc_b,cc_a};
            CGFloat gradientLocation[2] = {0,1};
            CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
            CGGradientRef gradient = CGGradientCreateWithColorComponents(colorSpace, gradientColors, gradientLocation, 2);
            CGColorSpaceRelease(colorSpace);
            
            CGContextReplacePathWithStrokedPath(context);
            CGContextClip(context);
            CGContextDrawLinearGradient(
                                        context,
                                        gradient,
                                        segment.startPoint,
                                        segment.endPoint,
                                        kCGGradientDrawsBeforeStartLocation | kCGGradientDrawsAfterEndLocation
                                        );
            CGGradientRelease(gradient);
            CGContextResetClip(context);
        }
        else {
            CGContextSetStrokeColorWithColor(context, segment.startColor.CGColor);
            CGContextStrokePath(context);
        }
    }
}

@end

