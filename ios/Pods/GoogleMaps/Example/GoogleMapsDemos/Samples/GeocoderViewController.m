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

#import "GoogleMapsDemos/Samples/GeocoderViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@implementation GeocoderViewController {
  GMSMapView *_mapView;
  GMSGeocoder *_geocoder;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:-33.868
                                                          longitude:151.2086
                                                               zoom:12];

  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  _mapView.delegate = self;

  _geocoder = [[GMSGeocoder alloc] init];

  self.view = _mapView;
}

- (void)mapView:(GMSMapView *)mapView didLongPressAtCoordinate:(CLLocationCoordinate2D)coordinate {
  // On a long press, reverse geocode this location.
  __weak __typeof__(self) weakSelf = self;
  GMSReverseGeocodeCallback handler = ^(GMSReverseGeocodeResponse *response, NSError *error) {
    [weakSelf handleResponse:response coordinate:coordinate error:error];
  };
  [_geocoder reverseGeocodeCoordinate:coordinate completionHandler:handler];
}

- (void)handleResponse:(nullable GMSReverseGeocodeResponse *)response
            coordinate:(CLLocationCoordinate2D)coordinate
                 error:(nullable NSError *)error {
  GMSAddress *address = response.firstResult;
  if (address) {
    NSLog(@"Geocoder result: %@", address);

    GMSMarker *marker = [GMSMarker markerWithPosition:address.coordinate];
    NSArray<NSString *> *lines = [address lines];

    marker.title = [lines firstObject];
    if (lines.count > 1) {
      marker.snippet = [lines objectAtIndex:1];
    }

    marker.appearAnimation = kGMSMarkerAnimationPop;
    marker.map = _mapView;
  } else {
    NSLog(@"Could not reverse geocode point (%f,%f): %@", coordinate.latitude, coordinate.longitude,
          error);
  }
}

@end
