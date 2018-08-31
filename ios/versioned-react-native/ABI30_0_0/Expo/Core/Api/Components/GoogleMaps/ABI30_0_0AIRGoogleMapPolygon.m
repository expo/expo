//
//  ABI30_0_0AIRGoogleMapPolygon.m
//
//  Created by Nick Italiano on 10/22/16.
//

#import "ABI30_0_0AIRGoogleMapPolygon.h"
#import "ABI30_0_0AIRGMSPolygon.h"
#import <GoogleMaps/GoogleMaps.h>

@implementation ABI30_0_0AIRGoogleMapPolygon

- (instancetype)init
{
  if (self = [super init]) {
    _polygon = [[ABI30_0_0AIRGMSPolygon alloc] init];
  }

  return self;
}

- (void)setCoordinates:(NSArray<ABI30_0_0AIRMapCoordinate *> *)coordinates
{
  _coordinates = coordinates;

  GMSMutablePath *path = [GMSMutablePath path];
  for(int i = 0; i < coordinates.count; i++)
  {
    [path addCoordinate:coordinates[i].coordinate];
  }

  _polygon.path = path;
}

- (void)setHoles:(NSArray<NSArray<ABI30_0_0AIRMapCoordinate *> *> *)holes
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
  _polygon.fillColor = fillColor;
}

-(void)setStrokeWidth:(double)strokeWidth
{
  _strokeWidth = strokeWidth;
  _polygon.strokeWidth = strokeWidth;
}

-(void)setStrokeColor:(UIColor *) strokeColor
{
  _strokeColor = strokeColor;
  _polygon.strokeColor = strokeColor;
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

- (void)setOnPress:(ABI30_0_0RCTBubblingEventBlock)onPress {
  _polygon.onPress = onPress;
}

@end
