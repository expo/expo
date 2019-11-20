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

#import "GoogleMapsDemos/Samples/CameraViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@implementation CameraViewController {
  GMSMapView *_mapView;
  NSTimer *timer;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:-37.809487
                                                          longitude:144.965699
                                                               zoom:20
                                                            bearing:0
                                                       viewingAngle:0];
  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  _mapView.settings.zoomGestures = NO;
  _mapView.settings.scrollGestures = NO;
  _mapView.settings.rotateGestures = NO;
  _mapView.settings.tiltGestures = NO;

  self.view = _mapView;
}

- (void)moveCamera {
  GMSCameraPosition *camera = _mapView.camera;
  float zoom = fmaxf(camera.zoom - 0.1f, 17.5f);

  GMSCameraPosition *newCamera =
      [[GMSCameraPosition alloc] initWithTarget:camera.target
                                           zoom:zoom
                                        bearing:camera.bearing + 10
                                   viewingAngle:camera.viewingAngle + 10];
  [_mapView animateToCameraPosition:newCamera];
}

- (void)viewDidAppear:(BOOL)animated {
  [super viewDidAppear:animated];
  timer = [NSTimer scheduledTimerWithTimeInterval:1.f/30.f
                                           target:self
                                         selector:@selector(moveCamera)
                                         userInfo:nil
                                          repeats:YES];
}

- (void)viewDidDisappear:(BOOL)animated {
  [super viewDidDisappear:animated];
  [timer invalidate];
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
  [timer invalidate];
}

@end
