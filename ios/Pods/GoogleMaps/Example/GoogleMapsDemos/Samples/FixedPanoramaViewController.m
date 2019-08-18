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

#import "GoogleMapsDemos/Samples/FixedPanoramaViewController.h"

#import <GoogleMaps/GoogleMaps.h>

static CLLocationCoordinate2D kPanoramaNear = {-33.732022, 150.312114};

@interface FixedPanoramaViewController () <GMSPanoramaViewDelegate>
@end

@implementation FixedPanoramaViewController {
  GMSPanoramaView *_view;
}

- (void)viewDidLoad {
  [super viewDidLoad];

  _view = [GMSPanoramaView panoramaWithFrame:CGRectZero
                              nearCoordinate:kPanoramaNear];
  _view.camera = [GMSPanoramaCamera cameraWithHeading:180
                                                pitch:-10
                                                 zoom:0];
  _view.delegate = self;
  _view.orientationGestures = NO;
  _view.navigationGestures = NO;
  _view.navigationLinksHidden = YES;
  self.view = _view;
}

@end
