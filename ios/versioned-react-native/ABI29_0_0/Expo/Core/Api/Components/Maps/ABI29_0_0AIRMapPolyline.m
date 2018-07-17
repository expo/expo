//
// Created by Leland Richardson on 12/27/15.
// Copyright (c) 2015 Facebook. All rights reserved.
//

#import "ABI29_0_0AIRMapPolyline.h"
#import "ABI29_0_0AIRMapPolylineRenderer.h"
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>


@implementation ABI29_0_0AIRMapPolyline {
    
}

- (void)setFillColor:(UIColor *)fillColor {
    _fillColor = fillColor;
    [self update];
}

- (void)setStrokeColor:(UIColor *)strokeColor {
    _strokeColor = strokeColor;
    [self update];
}

- (void)setStrokeColors:(NSArray<UIColor *> *)strokeColors {
    _strokeColors = strokeColors;
    if ((self.renderer != nil) && ![_renderer isKindOfClass:[ABI29_0_0AIRMapPolylineRenderer class]]) {
        self.renderer = [self createRenderer];
    }
    [self update];
}

- (void)setStrokeWidth:(CGFloat)strokeWidth {
    _strokeWidth = strokeWidth;
    [self update];
}

- (void)setLineJoin:(CGLineJoin)lineJoin {
    _lineJoin = lineJoin;
    [self update];
}

- (void)setLineCap:(CGLineCap)lineCap {
    _lineCap = lineCap;
    [self update];
}

- (void)setMiterLimit:(CGFloat)miterLimit {
    _miterLimit = miterLimit;
    [self update];
}

- (void)setLineDashPhase:(CGFloat)lineDashPhase {
    _lineDashPhase = lineDashPhase;
    [self update];
}

- (void)setLineDashPattern:(NSArray <NSNumber *> *)lineDashPattern {
    _lineDashPattern = lineDashPattern;
    [self update];
}

- (void)setCoordinates:(NSArray<ABI29_0_0AIRMapCoordinate *> *)coordinates {
    _coordinates = coordinates;
    CLLocationCoordinate2D coords[coordinates.count];
    for(int i = 0; i < coordinates.count; i++)
    {
        coords[i] = coordinates[i].coordinate;
    }
    self.polyline = [MKPolyline polylineWithCoordinates:coords count:coordinates.count];
    self.renderer = [self createRenderer];
    [self update];
}

- (MKOverlayPathRenderer*)createRenderer {
    if (self.polyline == nil) return nil;
    if (self.strokeColors == nil) {
        // Use the default renderer when no array of stroke-colors is defined.
        // This behaviour may be changed in the future if we permanently want to 
        // use the custom renderer, because it can add funtionality that is not
        // supported by the default renderer.
        return [[MKPolylineRenderer alloc] initWithPolyline:self.polyline];
    }
    else {
        return [[ABI29_0_0AIRMapPolylineRenderer alloc] initWithOverlay:self polyline:self.polyline];
    }
}

- (void) update
{
    if (!_renderer) return;
    [self updateRenderer:_renderer];
    
    if (_map == nil) return;
    [_map removeOverlay:self];
    [_map addOverlay:self];
}

- (void) updateRenderer:(MKOverlayPathRenderer*)renderer {
    renderer.fillColor = _fillColor;
    renderer.strokeColor = _strokeColor;
    renderer.lineWidth = _strokeWidth;
    renderer.lineCap = _lineCap;
    renderer.lineJoin = _lineJoin;
    renderer.miterLimit = _miterLimit;
    renderer.lineDashPhase = _lineDashPhase;
    renderer.lineDashPattern = _lineDashPattern;
    
    if ([renderer isKindOfClass:[ABI29_0_0AIRMapPolylineRenderer class]]) {
        ((ABI29_0_0AIRMapPolylineRenderer*)renderer).strokeColors = _strokeColors;
    }
}

#pragma mark MKOverlay implementation

- (CLLocationCoordinate2D) coordinate
{
    return self.polyline.coordinate;
}

- (MKMapRect) boundingMapRect
{
    return self.polyline.boundingMapRect;
}

- (BOOL)intersectsMapRect:(MKMapRect)mapRect
{
    BOOL answer = [self.polyline intersectsMapRect:mapRect];
    return answer;
}

- (BOOL)canReplaceMapContent
{
    return NO;
}


#pragma mark ABI29_0_0AIRMapSnapshot implementation

- (void) drawToSnapshot:(MKMapSnapshot *) snapshot context:(CGContextRef) context
{
    ABI29_0_0AIRMapPolylineRenderer* renderer = [[ABI29_0_0AIRMapPolylineRenderer alloc] initWithSnapshot:snapshot overlay:self polyline:self.polyline];
    [self updateRenderer:renderer];
    [renderer drawWithZoomScale:2 inContext:context];
}

@end
