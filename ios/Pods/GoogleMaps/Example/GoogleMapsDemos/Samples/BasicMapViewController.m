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

#import "GoogleMapsDemos/Samples/BasicMapViewController.h"

@implementation BasicMapViewController {
  UILabel *_statusLabel;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:-33.868
                                                          longitude:151.2086
                                                               zoom:6];
  GMSMapView *view = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  view.delegate = self;
  self.view = view;

  // Add status label, initially hidden.
  _statusLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, 0, 30)];
  _statusLabel.alpha = 0.0f;
  _statusLabel.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  _statusLabel.backgroundColor = [UIColor blueColor];
  _statusLabel.textColor = [UIColor whiteColor];
  _statusLabel.textAlignment = NSTextAlignmentCenter;

  [view addSubview:_statusLabel];
}

- (void)mapViewDidStartTileRendering:(GMSMapView *)mapView {
  _statusLabel.alpha = 0.8f;
  _statusLabel.text = @"Rendering";
}

- (void)mapViewDidFinishTileRendering:(GMSMapView *)mapView {
  _statusLabel.alpha = 0.0f;
}

@end
