//
//  AIRGoogleMapPolygon.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef HAVE_GOOGLE_MAPS

#import "AIRGoogleMapPolygon.h"
#import "AIRGMSPolygon.h"
#import <GoogleMaps/GoogleMaps.h>

@implementation AIRGoogleMapPolygon
{
  BOOL _didMoveToWindow;
}

- (instancetype)init
{
  if (self = [super init]) {
    _didMoveToWindow = false;
    _polygon = [[AIRGMSPolygon alloc] init];
  }

  return self;
}

- (void)didMoveToWindow {
  [super didMoveToWindow];
  if(_didMoveToWindow) return;
  _didMoveToWindow = true;
  if(_fillColor) {
    _polygon.fillColor = _fillColor;
  }
  if(_strokeColor) {
    _polygon.strokeColor = _strokeColor;
  }
  if(_strokeWidth) {
    _polygon.strokeWidth = _strokeWidth;
  }
}

- (void)setCoordinates:(NSArray<AIRMapCoordinate *> *)coordinates
{
  _coordinates = coordinates;

  GMSMutablePath *path = [GMSMutablePath path];
  for(int i = 0; i < coordinates.count; i++)
  {
    [path addCoordinate:coordinates[i].coordinate];
  }

  _polygon.path = path;
}

- (void)setHoles:(NSArray<NSArray<AIRMapCoordinate *> *> *)holes
{
  _holes = holes;

  if (holes.count)
  {
    NSMutableArray<GMSMutablePath *> *interiorPolygons = [NSMutableArray array];
    for(int h = 0; h < holes.count; h++)
    {
      GMSMutablePath *path = [GMSMutablePath path];
      for(int i = 0; i < holes[h].count; i++)
      {
        [path addCoordinate:holes[h][i].coordinate];
      }
      [interiorPolygons addObject:path];
    }

    _polygon.holes = interiorPolygons;
  }
}

-(void)setFillColor:(UIColor *)fillColor
{
  _fillColor = fillColor;
  if(_didMoveToWindow) {
    _polygon.fillColor = fillColor;
  }
}

-(void)setStrokeWidth:(double)strokeWidth
{
  _strokeWidth = strokeWidth;
  if(_didMoveToWindow) {
    _polygon.strokeWidth = strokeWidth;
  }
}

-(void)setStrokeColor:(UIColor *) strokeColor
{
  _strokeColor = strokeColor;
  if(_didMoveToWindow) {
    _polygon.strokeColor = strokeColor;
  }
}

-(void)setGeodesic:(BOOL)geodesic
{
  _geodesic = geodesic;
  _polygon.geodesic = geodesic;
}

-(void)setZIndex:(int)zIndex
{
  _zIndex = zIndex;
  _polygon.zIndex = zIndex;
}

-(void)setTappable:(BOOL)tappable
{
  _tappable = tappable;
  _polygon.tappable = tappable;
}

- (void)setOnPress:(RCTBubblingEventBlock)onPress {
  _polygon.onPress = onPress;
}

@end

#endif
