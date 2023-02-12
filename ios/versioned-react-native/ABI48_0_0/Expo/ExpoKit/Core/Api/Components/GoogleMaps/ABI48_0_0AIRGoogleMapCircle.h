//
//  ABI48_0_0AIRGoogleMapsCircle.h
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import "ABI48_0_0AIRMapCoordinate.h"

@interface ABI48_0_0AIRGoogleMapCircle : UIView

@property (nonatomic, strong) GMSCircle *circle;
@property (nonatomic, assign) double radius;
@property (nonatomic, assign) CLLocationCoordinate2D centerCoordinate;
@property (nonatomic, strong) UIColor *strokeColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, strong) UIColor *fillColor;
@property (nonatomic, assign) int zIndex;

@end

#endif
