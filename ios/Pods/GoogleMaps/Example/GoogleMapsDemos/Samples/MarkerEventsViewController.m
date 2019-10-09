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

#import "GoogleMapsDemos/Samples/MarkerEventsViewController.h"

#import <QuartzCore/QuartzCore.h>

#import <GoogleMaps/GoogleMaps.h>

@implementation MarkerEventsViewController {
  GMSMapView *_mapView;
  GMSMarker *_melbourneMarker;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:-37.81969
                                                          longitude:144.966085
                                                               zoom:4];
  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];

  GMSMarker *sydneyMarker = [[GMSMarker alloc] init];
  sydneyMarker.position = CLLocationCoordinate2DMake(-33.8683, 151.2086);
  sydneyMarker.map = _mapView;

  _melbourneMarker = [[GMSMarker alloc] init];
  _melbourneMarker.position = CLLocationCoordinate2DMake(-37.81969, 144.966085);
  _melbourneMarker.map = _mapView;

  _mapView.delegate = self;
  self.view = _mapView;
}

#pragma mark - GMSMapViewDelegate

- (UIView *)mapView:(GMSMapView *)mapView markerInfoWindow:(GMSMarker *)marker {
  if (marker == _melbourneMarker) {
    return [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"Icon"]];
  }

  return nil;
}

- (BOOL)mapView:(GMSMapView *)mapView didTapMarker:(GMSMarker *)marker {
  // Animate to the marker
  [CATransaction begin];
  [CATransaction setAnimationDuration:3.f];  // 3 second animation

  GMSCameraPosition *camera =
      [[GMSCameraPosition alloc] initWithTarget:marker.position
                                           zoom:8
                                        bearing:50
                                   viewingAngle:60];
  [mapView animateToCameraPosition:camera];
  [CATransaction commit];

  // Melbourne marker has a InfoWindow so return NO to allow markerInfoWindow to
  // fire. Also check that the marker isn't already selected so that the
  // InfoWindow doesn't close.
  if (marker == _melbourneMarker &&
      mapView.selectedMarker != _melbourneMarker) {
    return NO;
  }

  // The Tap has been handled so return YES
  return YES;
}

@end
