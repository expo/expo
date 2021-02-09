/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

#import "GoogleMapsDemos/Samples/MapLayerViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@implementation MapLayerViewController {
  GMSMapView *_mapView;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:-37.81969
                                                          longitude:144.966085
                                                               zoom:4];
  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  self.view = _mapView;

  GMSMapView *mapView = _mapView;
  dispatch_async(dispatch_get_main_queue(), ^{
    mapView.myLocationEnabled = YES;
  });

  UIBarButtonItem *myLocationButton =
      [[UIBarButtonItem alloc] initWithTitle:@"Fly to My Location"
                                       style:UIBarButtonItemStylePlain
                                      target:self
                                      action:@selector(didTapMyLocation)];
  self.navigationItem.rightBarButtonItem = myLocationButton;

}

- (void)didTapMyLocation {
  CLLocation *location = _mapView.myLocation;
  if (!location || !CLLocationCoordinate2DIsValid(location.coordinate)) {
    return;
  }

  _mapView.layer.cameraLatitude = location.coordinate.latitude;
  _mapView.layer.cameraLongitude = location.coordinate.longitude;
  _mapView.layer.cameraBearing = 0.0;

  // Access the GMSMapLayer directly to modify the following properties with a
  // specified timing function and duration.

  CAMediaTimingFunction *curve =
      [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
  CABasicAnimation *animation;

  animation = [CABasicAnimation animationWithKeyPath:kGMSLayerCameraLatitudeKey];
  animation.duration = 2.0f;
  animation.timingFunction = curve;
  animation.toValue = @(location.coordinate.latitude);
  [_mapView.layer addAnimation:animation forKey:kGMSLayerCameraLatitudeKey];

  animation = [CABasicAnimation animationWithKeyPath:kGMSLayerCameraLongitudeKey];
  animation.duration = 2.0f;
  animation.timingFunction = curve;
  animation.toValue = @(location.coordinate.longitude);
  [_mapView.layer addAnimation:animation forKey:kGMSLayerCameraLongitudeKey];

  animation = [CABasicAnimation animationWithKeyPath:kGMSLayerCameraBearingKey];
  animation.duration = 2.0f;
  animation.timingFunction = curve;
  animation.toValue = @0.0;
  [_mapView.layer addAnimation:animation forKey:kGMSLayerCameraBearingKey];

  // Fly out to the minimum zoom and then zoom back to the current zoom!
  CGFloat zoom = _mapView.camera.zoom;
  NSArray *keyValues = @[@(zoom), @(kGMSMinZoomLevel), @(zoom)];
  CAKeyframeAnimation *keyFrameAnimation =
      [CAKeyframeAnimation animationWithKeyPath:kGMSLayerCameraZoomLevelKey];
  keyFrameAnimation.duration = 2.0f;
  keyFrameAnimation.values = keyValues;
  [_mapView.layer addAnimation:keyFrameAnimation forKey:kGMSLayerCameraZoomLevelKey];
}

@end
