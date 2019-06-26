//
//  AIRGoogleMapsCircle.h
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import "AIRMapCoordinate.h"

@interface AIRGoogleMapCircle : UIView

@property (nonatomic, strong) GMSCircle *circle;
@property (nonatomic, assign) double radius;
@property (nonatomic, assign) CLLocationCoordinate2D centerCoordinate;
@property (nonatomic, assign) UIColor *strokeColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, assign) UIColor *fillColor;
@property (nonatomic, assign) int zIndex;

@end

#endif
