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

#import "GoogleMapsDemos/Samples/PanoramaViewController.h"

#import <GoogleMaps/GoogleMaps.h>

static CLLocationCoordinate2D kPanoramaNear = {40.761388, -73.978133};
static CLLocationCoordinate2D kMarkerAt = {40.761455, -73.977814};

@interface PanoramaViewController () <GMSPanoramaViewDelegate>
@end

@implementation PanoramaViewController {
  GMSPanoramaView *_view;
  BOOL _configured;
  UILabel *_statusLabel;
}

- (void)viewDidLoad {
  [super viewDidLoad];

  _view = [GMSPanoramaView panoramaWithFrame:CGRectZero
                              nearCoordinate:kPanoramaNear];
  _view.backgroundColor = [UIColor grayColor];
  _view.delegate = self;
  self.view = _view;

  // Add status label, initially hidden.
  _statusLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, 0, 30)];
  _statusLabel.alpha = 0.0f;
  _statusLabel.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  _statusLabel.backgroundColor = [UIColor blueColor];
  _statusLabel.textColor = [UIColor whiteColor];
  _statusLabel.textAlignment = NSTextAlignmentCenter;

  [_view addSubview:_statusLabel];
}

#pragma mark - GMSPanoramaDelegate

- (void)panoramaView:(GMSPanoramaView *)panoramaView
       didMoveCamera:(GMSPanoramaCamera *)camera {
  NSLog(@"Camera: (%f,%f,%f)",
        camera.orientation.heading, camera.orientation.pitch, camera.zoom);
}

- (void)panoramaView:(GMSPanoramaView *)view
   didMoveToPanorama:(GMSPanorama *)panorama {
  if (!_configured) {
    GMSMarker *marker = [GMSMarker markerWithPosition:kMarkerAt];
    marker.icon = [GMSMarker markerImageWithColor:[UIColor purpleColor]];
    marker.panoramaView = _view;

    CLLocationDegrees heading = GMSGeometryHeading(kPanoramaNear, kMarkerAt);
    _view.camera =
        [GMSPanoramaCamera cameraWithHeading:heading pitch:0 zoom:1];

    _configured = YES;
  }
}

- (void)panoramaViewDidStartRendering:(GMSPanoramaView *)panoramaView {
  _statusLabel.alpha = 0.8f;
  _statusLabel.text = @"Rendering";
}

- (void)panoramaViewDidFinishRendering:(GMSPanoramaView *)panoramaView {
  _statusLabel.alpha = 0.0f;
}

@end
