//
//  AIRGoogleMapsCircle.m
//
//  Created by Nick Italiano on 10/24/16.
//

#ifdef HAVE_GOOGLE_MAPS
#import <UIKit/UIKit.h>
#import "AIRGoogleMapCircle.h"
#import <GoogleMaps/GoogleMaps.h>
#import <React/RCTUtils.h>

@implementation AIRGoogleMapCircle
{
  BOOL _didMoveToWindow;
}

- (instancetype)init
{
  if (self = [super init]) {
    _didMoveToWindow = false;
    _circle = [[GMSCircle alloc] init];
  }
  return self;
}

- (void)didMoveToWindow {
  [super didMoveToWindow];
  if(_didMoveToWindow) return;
  _didMoveToWindow = true;
  if(_fillColor) {
    _circle.fillColor = _fillColor;
  }
  if(_strokeColor) {
    _circle.strokeColor = _strokeColor;
  }
  if(_strokeWidth) {
    _circle.strokeWidth = _strokeWidth;
  }
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
  if(_didMoveToWindow) {
    _circle.strokeColor = strokeColor;
  }
}

-(void)setStrokeWidth:(double)strokeWidth
{
  _strokeWidth = strokeWidth;
  if(_didMoveToWindow) {
    _circle.strokeWidth = strokeWidth;
  }
}

-(void)setFillColor:(UIColor *)fillColor
{
  _fillColor = fillColor;
  if(_didMoveToWindow) {
    _circle.fillColor = fillColor;
  }
}

-(void)setZIndex:(int)zIndex
{
  _zIndex = zIndex;
  _circle.zIndex = zIndex;
}

@end

#endif
