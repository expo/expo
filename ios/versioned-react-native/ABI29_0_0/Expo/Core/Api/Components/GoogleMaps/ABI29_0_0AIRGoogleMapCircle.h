//
//  ABI29_0_0AIRGoogleMapsCircle.h
//
//  Created by Nick Italiano on 10/24/16.
//

#import <GoogleMaps/GoogleMaps.h>
#import "ABI29_0_0AIRMapCoordinate.h"

@interface ABI29_0_0AIRGoogleMapCircle : UIView

@property (nonatomic, strong) GMSCircle *circle;
@property (nonatomic, assign) double radius;
@property (nonatomic, assign) CLLocationCoordinate2D centerCoordinate;
@property (nonatomic, assign) UIColor *strokeColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, assign) UIColor *fillColor;
@property (nonatomic, assign) int zIndex;

@end
