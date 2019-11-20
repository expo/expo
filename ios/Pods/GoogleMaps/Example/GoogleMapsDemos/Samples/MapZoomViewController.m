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

#import "GoogleMapsDemos/Samples/MapZoomViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@implementation MapZoomViewController {
  GMSMapView *_mapView;
  UITextView *_zoomRangeView;
  NSUInteger _nextMode;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:-33.868
                                                          longitude:151.2086
                                                               zoom:6];
  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  _mapView.settings.scrollGestures = NO;
  self.view = _mapView;

  // Add a display for the current zoom range restriction.
  _zoomRangeView = [[UITextView alloc] init];
  _zoomRangeView.frame =
      CGRectMake(0, 0, CGRectGetWidth(self.view.frame), 0);
  _zoomRangeView.text = @"";
  _zoomRangeView.textAlignment = NSTextAlignmentCenter;
  _zoomRangeView.backgroundColor = [UIColor colorWithWhite:1.0 alpha:0.8f];
  _zoomRangeView.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  _zoomRangeView.editable = NO;
  [self.view addSubview:_zoomRangeView];
  [_zoomRangeView sizeToFit];
  [self didTapNext];

  // Add a button toggling through modes.
  self.navigationItem.rightBarButtonItem =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemPlay
                                                    target:self
                                                    action:@selector(didTapNext)];
}

- (void)didTapNext {
  NSString *label = @"";
  float minZoom = kGMSMinZoomLevel;
  float maxZoom = kGMSMaxZoomLevel;

  switch (_nextMode) {
    case 0:
      label = @"Default";
      break;
    case 1:
      minZoom = 18;
      label = @"Zoomed in";
      break;
    case 2:
      maxZoom = 8;
      label = @"Zoomed out";
      break;
    case 3:
      minZoom = 10;
      maxZoom = 11.5;
      label = @"Small range";
      break;
  }
  _nextMode = (_nextMode + 1) % 4;

  [_mapView setMinZoom:minZoom maxZoom:maxZoom];
  _zoomRangeView.text =
      [NSString stringWithFormat:@"%@ (%.2f - %.2f)", label, _mapView.minZoom, _mapView.maxZoom];
}

@end
