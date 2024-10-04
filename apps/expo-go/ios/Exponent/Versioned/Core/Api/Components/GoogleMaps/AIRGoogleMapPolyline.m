//
//  AIRGoogleMapPolyline.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef HAVE_GOOGLE_MAPS
#import <UIKit/UIKit.h>
#import "AIRGoogleMapPolyline.h"
#import "AIRGMSPolyline.h"
#import "AIRMapCoordinate.h"
#import "AIRGoogleMapMarker.h"
#import "AIRGoogleMapMarkerManager.h"
#import <GoogleMaps/GoogleMaps.h>
#import <React/RCTUtils.h>

@implementation AIRGoogleMapPolyline

- (instancetype)init
{
  if (self = [super init]) {
    _polyline = [[AIRGMSPolyline alloc] init];
  }
  return self;
}

-(void)setCoordinates:(NSArray<AIRMapCoordinate *> *)coordinates
{
  _coordinates = coordinates;

  GMSMutablePath *path = [GMSMutablePath path];
  for(int i = 0; i < coordinates.count; i++)
  {
    [path addCoordinate:coordinates[i].coordinate];
  }

  _polyline.path = path;

  [self configureStyleSpansIfNeeded];
}

-(void)setStrokeColor:(UIColor *)strokeColor
{
  _strokeColor = strokeColor;
  _polyline.strokeColor = strokeColor;
  [self configureStyleSpansIfNeeded];
}

-(void)setStrokeColors:(NSArray<UIColor *> *)strokeColors
{
  NSMutableArray *spans = [NSMutableArray arrayWithCapacity:[strokeColors count]];
  for (int i = 0; i < [strokeColors count]; i++)
  {
    GMSStrokeStyle *stroke;

     if (i == 0) {
      stroke = [GMSStrokeStyle solidColor:strokeColors[i]];
    } else {
      stroke = [GMSStrokeStyle gradientFromColor:strokeColors[i-1] toColor:strokeColors[i]];
    }

     [spans addObject:[GMSStyleSpan spanWithStyle:stroke]];
  }

  _strokeColors = strokeColors;
  _polyline.spans = spans;
}

-(void)setStrokeWidth:(double)strokeWidth
{
  _strokeWidth = strokeWidth;
  _polyline.strokeWidth = strokeWidth;
}

-(void)setFillColor:(UIColor *)fillColor
{
  _fillColor = fillColor;
  _polyline.spans = @[[GMSStyleSpan spanWithColor:fillColor]];
}

- (void)setLineDashPattern:(NSArray<NSNumber *> *)lineDashPattern {
  _lineDashPattern = lineDashPattern;
  [self configureStyleSpansIfNeeded];
}

-(void)setGeodesic:(BOOL)geodesic
{
  _geodesic = geodesic;
  _polyline.geodesic = geodesic;
}

-(void)setTitle:(NSString *)title
{
  _title = title;
  _polyline.title = _title;
}

-(void) setZIndex:(int)zIndex
{
  _zIndex = zIndex;
  _polyline.zIndex = zIndex;
}

-(void)setTappable:(BOOL)tappable
{
  _tappable = tappable;
  _polyline.tappable = tappable;
}

- (void)setOnPress:(RCTBubblingEventBlock)onPress {
  _polyline.onPress = onPress;
}

- (void)configureStyleSpansIfNeeded {
  if (!_strokeColor || !_lineDashPattern || !_polyline.path) {
      return;
  }

  BOOL isLine = YES;
  NSMutableArray *styles = [[NSMutableArray alloc] init];
  for (NSInteger i = 0; i < _lineDashPattern.count; i++) {
    if (isLine) {
      [styles addObject:[GMSStrokeStyle solidColor:_strokeColor]];
    } else {
      [styles addObject:[GMSStrokeStyle solidColor:[UIColor clearColor]]];
    }
    isLine = !isLine;
  }

  _polyline.spans = GMSStyleSpans(_polyline.path, styles, _lineDashPattern, kGMSLengthRhumb);
}

@end

#endif
