//
//  ABI15_0_0AIRGoogleMapPolygon.h
//
//  Created by Nick Italiano on 10/22/16.
//

#import <GoogleMaps/GoogleMaps.h>
#import "ABI15_0_0AIRMapCoordinate.h"

@interface ABI15_0_0AIRGoogleMapPolygon : UIView

@property (nonatomic, strong) GMSPolygon *polygon;
@property (nonatomic, strong) NSArray<ABI15_0_0AIRMapCoordinate *> *coordinates;
@property (nonatomic, strong) NSArray<NSArray<ABI15_0_0AIRMapCoordinate *> *> *holes;

@property (nonatomic, assign) UIColor *fillColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, assign) UIColor *strokeColor;
@property (nonatomic, assign) BOOL geodesic;
@property (nonatomic, assign) int zIndex;

@end
