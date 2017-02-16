//
//  AIRGoogleMapPolygon.h
//
//  Created by Nick Italiano on 10/22/16.
//

#import <GoogleMaps/GoogleMaps.h>
#import "AIRMapCoordinate.h"

@interface AIRGoogleMapPolygon : UIView

@property (nonatomic, strong) GMSPolygon *polygon;
@property (nonatomic, strong) NSArray<AIRMapCoordinate *> *coordinates;
@property (nonatomic, strong) NSArray<NSArray<AIRMapCoordinate *> *> *holes;

@property (nonatomic, assign) UIColor *fillColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, assign) UIColor *strokeColor;
@property (nonatomic, assign) BOOL geodesic;
@property (nonatomic, assign) int zIndex;

@end
