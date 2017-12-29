//
//  AIRGoogleMapPolyline.h
//
//  Created by Nick Italiano on 10/22/16.
//
#import <UIKit/UIKit.h>
#import <GoogleMaps/GoogleMaps.h>
#import "AIRMapCoordinate.h"
#import "AIRGoogleMapMarker.h"

@interface AIRGoogleMapPolyline : UIView

@property (nonatomic, strong) GMSPolyline* polyline;
@property (nonatomic, strong) NSArray<AIRMapCoordinate *> *coordinates;
@property (nonatomic, strong) UIColor *strokeColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, assign) UIColor *fillColor;
@property (nonatomic, assign) BOOL geodesic;
@property (nonatomic, assign) NSString *title;
@property (nonatomic, assign) int zIndex;

@end
