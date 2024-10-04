//
//  ABI42_0_0AIRGoogleMapsCircle.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef ABI42_0_0HAVE_GOOGLE_MAPS
#import <UIKit/UIKit.h>
#import "ABI42_0_0AIRGoogleMapCircle.h"
#import <GoogleMaps/GoogleMaps.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>

@implementation ABI42_0_0AIRGoogleMapCircle

- (instancetype)init
{
  if (self = [super init]) {
    _circle = [[GMSCircle alloc] init];
  }
  return self;
}

- (void)setRadius:(double)radius
{
  _radius = radius;
  _circle.radius = radius;
}

- (void)setCenterCoordinate:(CLLocationCoordinate2D)centerCoordinate
{
  _centerCoordinate = centerCoordinate;
  _circle.position = centerCoordinate;
}

-(void)setStrokeColor:(UIColor *)strokeColor
{
  _strokeColor = strokeColor;
  _circle.strokeColor = strokeColor;
}

-(void)setStrokeWidth:(double)strokeWidth
{
  _strokeWidth = strokeWidth;
  _circle.strokeWidth = strokeWidth;
}

-(void)setFillColor:(UIColor *)fillColor
{
  _fillColor = fillColor;
  _circle.fillColor = fillColor;
}

-(void)setZIndex:(int)zIndex
{
  _zIndex = zIndex;
  _circle.zIndex = zIndex;
}

@end

#endif
