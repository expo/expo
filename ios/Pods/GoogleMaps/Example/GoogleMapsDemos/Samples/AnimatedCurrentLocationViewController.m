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

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GoogleMapsDemos/Samples/AnimatedCurrentLocationViewController.h"

@implementation AnimatedCurrentLocationViewController {
  CLLocationManager *_manager;
  GMSMapView        *_mapView;
  GMSMarker         *_locationMarker;

}

- (void)viewDidLoad {
  [super viewDidLoad];

  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:38.8879
                                                          longitude:-77.0200
                                                               zoom:17];
  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  _mapView.settings.myLocationButton = NO;
  _mapView.settings.indoorPicker = NO;

  self.view = _mapView;

  // Setup location services
  if (![CLLocationManager locationServicesEnabled]) {
    NSLog(@"Please enable location services");
    return;
  }

  if ([CLLocationManager authorizationStatus] == kCLAuthorizationStatusDenied) {
    NSLog(@"Please authorize location services");
    return;
  }

  _manager = [[CLLocationManager alloc] init];
  if ([_manager respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
    [_manager requestWhenInUseAuthorization];
  }
  _manager.delegate = self;
  _manager.desiredAccuracy = kCLLocationAccuracyBest;
  _manager.distanceFilter = 5.0f;
  [_manager startUpdatingLocation];

}

#pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
  if ([CLLocationManager authorizationStatus] == kCLAuthorizationStatusDenied) {
    NSLog(@"Please authorize location services");
    return;
  }

  NSLog(@"CLLocationManager error: %@", error.localizedFailureReason);
  return;
}

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray *)locations {
  CLLocation *location = [locations lastObject];

  if (_locationMarker == nil) {
    _locationMarker = [[GMSMarker alloc] init];
    _locationMarker.position = location.coordinate;

    // Animated walker images derived from an www.angryanimator.com tutorial.
    // See: http://www.angryanimator.com/word/2010/11/26/tutorial-2-walk-cycle/

    NSArray *frames = @[[UIImage imageNamed:@"step1"],
                        [UIImage imageNamed:@"step2"],
                        [UIImage imageNamed:@"step3"],
                        [UIImage imageNamed:@"step4"],
                        [UIImage imageNamed:@"step5"],
                        [UIImage imageNamed:@"step6"],
                        [UIImage imageNamed:@"step7"],
                        [UIImage imageNamed:@"step8"]];

    _locationMarker.icon = [UIImage animatedImageWithImages:frames duration:0.8];
    _locationMarker.groundAnchor = CGPointMake(0.5f, 0.97f); // Taking into account walker's shadow
    _locationMarker.map = _mapView;
  } else {
    [CATransaction begin];
    [CATransaction setAnimationDuration:2.0];
    _locationMarker.position = location.coordinate;
    [CATransaction commit];
  }

  GMSCameraUpdate *move = [GMSCameraUpdate setTarget:location.coordinate zoom:17];
  [_mapView animateWithCameraUpdate:move];
}


@end
