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

#import "GoogleMapsDemos/Samples/MarkersViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@implementation MarkersViewController {
  GMSMarker *_sydneyMarker;
  GMSMarker *_melbourneMarker;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:-37.81969
                                                          longitude:144.966085
                                                               zoom:4];
  GMSMapView *mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];

  _sydneyMarker = [[GMSMarker alloc] init];
  _sydneyMarker.title = @"Sydney";
  _sydneyMarker.snippet = @"Population: 4,605,992";
  _sydneyMarker.position = CLLocationCoordinate2DMake(-33.8683, 151.2086);
  _sydneyMarker.flat = NO;
  _sydneyMarker.rotation = 30.0;
  NSLog(@"sydneyMarker: %@", _sydneyMarker);

  GMSMarker *australiaMarker = [[GMSMarker alloc] init];
  australiaMarker.title = @"Australia";
  australiaMarker.position = CLLocationCoordinate2DMake(-27.994401,140.07019);
  australiaMarker.appearAnimation = kGMSMarkerAnimationPop;
  australiaMarker.flat = YES;
  australiaMarker.draggable = YES;
  australiaMarker.groundAnchor = CGPointMake(0.5, 0.5);
  australiaMarker.icon = [UIImage imageNamed:@"australia"];
  australiaMarker.map = mapView;

  // Set the marker in Sydney to be selected
  mapView.selectedMarker = _sydneyMarker;

  self.view = mapView;
  self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemAdd target:self action:@selector(didTapAdd)];
}

- (void)didTapAdd {
  if (_sydneyMarker.map == nil) {
    _sydneyMarker.map = (GMSMapView *)self.view;
//    _sydneyMarker.rotation += 45.0;
  } else {
    _sydneyMarker.map = nil;
  }

  _melbourneMarker.map = nil;
  _melbourneMarker = [[GMSMarker alloc] init];
  _melbourneMarker.title = @"Melbourne";
  _melbourneMarker.snippet = @"Population: 4,169,103";
  _melbourneMarker.position = CLLocationCoordinate2DMake(-37.81969, 144.966085);
  _melbourneMarker.map = (GMSMapView *)self.view;
}


@end
