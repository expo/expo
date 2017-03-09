//
//  ABI15_0_0AIRGoogleMapPolyline.h
//
//  Created by Nick Italiano on 10/22/16.
//
#import <UIKit/UIKit.h>
#import <GoogleMaps/GoogleMaps.h>
#import "ABI15_0_0AIRMapCoordinate.h"
#import "ABI15_0_0AIRGoogleMapMarker.h"

@interface ABI15_0_0AIRGoogleMapPolyline : UIView

@property (nonatomic, strong) GMSPolyline* polyline;
@property (nonatomic, strong) NSArray<ABI15_0_0AIRMapCoordinate *> *coordinates;
@property (nonatomic, strong) UIColor *strokeColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, assign) UIColor *fillColor;
@property (nonatomic, assign) BOOL geodesic;
@property (nonatomic, assign) NSString *title;
@property (nonatomic, assign) int zIndex;

@end
