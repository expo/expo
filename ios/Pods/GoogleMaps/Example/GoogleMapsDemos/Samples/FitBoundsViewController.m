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

#import "GoogleMapsDemos/Samples/FitBoundsViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@interface FitBoundsViewController () <GMSMapViewDelegate>
@end

@implementation FitBoundsViewController {
  GMSMapView *_mapView;
  NSMutableArray *_markers;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:-37.81969
                                                          longitude:144.966085
                                                               zoom:4];
  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  _mapView.delegate = self;
  self.view = _mapView;

  // Add a default marker around Sydney.
  GMSMarker *sydneyMarker = [[GMSMarker alloc] init];
  sydneyMarker.title = @"Sydney!";
  sydneyMarker.icon = [UIImage imageNamed:@"glow-marker"];
  sydneyMarker.position = CLLocationCoordinate2DMake(-33.8683, 151.2086);
  sydneyMarker.map = _mapView;

  GMSMarker *anotherSydneyMarker = [[GMSMarker alloc] init];
  anotherSydneyMarker.title = @"Sydney 2!";
  anotherSydneyMarker.icon = [UIImage imageNamed:@"glow-marker"];
  anotherSydneyMarker.position = CLLocationCoordinate2DMake(-33.8683, 149.2086);
  anotherSydneyMarker.map = _mapView;

  // Create a list of markers, adding the Sydney marker.
  _markers = [NSMutableArray arrayWithObject:sydneyMarker];
  [_markers addObject:anotherSydneyMarker];

  // Create a button that, when pressed, updates the camera to fit the bounds
  // of the specified markers.
  UIBarButtonItem *fitBoundsButton =
      [[UIBarButtonItem alloc] initWithTitle:@"Fit Bounds"
                                       style:UIBarButtonItemStylePlain
                                      target:self
                                      action:@selector(didTapFitBounds)];
  self.navigationItem.rightBarButtonItem = fitBoundsButton;
}

- (void)didTapFitBounds {
  if (_markers.count == 0) return;
  CLLocationCoordinate2D firstPos = ((GMSMarker *)_markers.firstObject).position;
  GMSCoordinateBounds *bounds =
      [[GMSCoordinateBounds alloc] initWithCoordinate:firstPos coordinate:firstPos];
  for (GMSMarker *marker in _markers) {
    bounds = [bounds includingCoordinate:marker.position];
  }
  GMSCameraUpdate *update = [GMSCameraUpdate fitBounds:bounds withPadding:50.0f];
  [_mapView moveCamera:update];
}

#pragma mark - GMSMapViewDelegate

- (void)mapView:(GMSMapView *)mapView
    didLongPressAtCoordinate:(CLLocationCoordinate2D)coordinate {
  GMSMarker *marker = [[GMSMarker alloc] init];
  marker.title = [NSString stringWithFormat:@"Marker at: %.2f,%.2f",
                  coordinate.latitude, coordinate.longitude];
  marker.position = coordinate;
  marker.appearAnimation = kGMSMarkerAnimationPop;
  marker.map = _mapView;

  // Add the new marker to the list of markers.
  [_markers addObject:marker];
}

@end
