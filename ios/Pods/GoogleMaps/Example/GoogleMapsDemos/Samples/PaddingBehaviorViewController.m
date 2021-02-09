/*
 * Copyright 2017 Google Inc. All rights reserved.
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

#import "GoogleMapsDemos/Samples/PaddingBehaviorViewController.h"

#import <GoogleMaps/GoogleMaps.h>

static CLLocationCoordinate2D kPanoramaNear = {40.761388, -73.978133};

@interface PaddingBehaviorViewController () <GMSMapViewDelegate>
@end

@implementation PaddingBehaviorViewController {
  GMSMapView *_mapView;
  GMSPanoramaView *_panoramaView;

  UILabel *_statusLabel;
  UIButton *_changeBehaviorButton;
  UIButton *_toggleFrameButton;
  UIBarButtonItem *_toggleViewButton;

  BOOL _hasShrunk;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera =
      [GMSCameraPosition cameraWithLatitude:-33.868 longitude:151.2086 zoom:6];
  _mapView = [GMSMapView mapWithFrame:self.view.bounds camera:camera];
  _mapView.padding = UIEdgeInsetsMake(0, 20, 40, 60);
  _mapView.delegate = self;
  _mapView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self.view addSubview:_mapView];

  // Add status label.
  _statusLabel = [[UILabel alloc] initWithFrame:CGRectMake(30, 0, 0, 30)];
  _statusLabel.textColor = [UIColor brownColor];
  _statusLabel.textAlignment = NSTextAlignmentLeft;
  _statusLabel.text = @"Behavior: Always";
  [_statusLabel sizeToFit];

  // Add behavior modifier button.
  _changeBehaviorButton = [UIButton buttonWithType:UIButtonTypeSystem];
  _changeBehaviorButton.frame = CGRectMake(30, 30, 0, 0);
  [_changeBehaviorButton setTitle:@"Next Behavior" forState:UIControlStateNormal];
  [_changeBehaviorButton sizeToFit];
  [_changeBehaviorButton addTarget:self
                            action:@selector(nextBehavior)
                  forControlEvents:UIControlEventTouchUpInside];

  // Add frame animation button.
  _toggleViewButton = [[UIBarButtonItem alloc] initWithTitle:@"Toggle View"
                                                       style:UIBarButtonItemStylePlain
                                                      target:self
                                                      action:@selector(toggleViewType)];
  self.navigationItem.rightBarButtonItem = _toggleViewButton;

  // Add change view type button.
  _toggleFrameButton = [UIButton buttonWithType:UIButtonTypeSystem];
  _toggleFrameButton.frame = CGRectMake(30, 60, 0, 0);
  [_toggleFrameButton setTitle:@"Animate Frame" forState:UIControlStateNormal];
  [_toggleFrameButton sizeToFit];
  [_toggleFrameButton addTarget:self
                         action:@selector(toggleFrame)
               forControlEvents:UIControlEventTouchUpInside];

  [_mapView addSubview:_statusLabel];
  [_mapView addSubview:_changeBehaviorButton];
  [_mapView addSubview:_toggleFrameButton];

  _hasShrunk = NO;

  // Pre-load PanoramaView
  _panoramaView = [GMSPanoramaView panoramaWithFrame:self.view.bounds nearCoordinate:kPanoramaNear];
  _panoramaView.autoresizingMask =
      UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
}

#pragma mark - Button Click Handlers

- (void)toggleFrame {
  CGSize size = self.view.bounds.size;
  CGPoint point = self.view.bounds.origin;
  [UIView animateWithDuration:2.0
                   animations:^{
                     if (self->_hasShrunk) {
                       self->_mapView.frame = self.view.bounds;
                       self->_panoramaView.frame = self->_mapView.frame;
                     } else {
                       self->_mapView.frame =
                           CGRectMake(point.x, point.y, size.width / 2, size.height / 2);
                       self->_panoramaView.frame = self->_mapView.frame;
                     }
                     self->_hasShrunk = !self->_hasShrunk;
                     [self.view setNeedsLayout];
                     [self.view layoutIfNeeded];
                   }];
}

- (void)toggleViewType {
  if ([self.view.subviews containsObject:_mapView]) {
    [_mapView removeFromSuperview];
    [self.view addSubview:_panoramaView];
    [_panoramaView addSubview:_toggleFrameButton];
  } else {
    [_panoramaView removeFromSuperview];
    [self.view addSubview:_mapView];
    [_mapView addSubview:_toggleFrameButton];
  }

}

- (void)nextBehavior {
  switch (_mapView.paddingAdjustmentBehavior) {
    case kGMSMapViewPaddingAdjustmentBehaviorAlways:
      _mapView.paddingAdjustmentBehavior = kGMSMapViewPaddingAdjustmentBehaviorAutomatic;
      _statusLabel.text = @"Behavior: Automatic";
      break;
    case kGMSMapViewPaddingAdjustmentBehaviorAutomatic:
      _mapView.paddingAdjustmentBehavior = kGMSMapViewPaddingAdjustmentBehaviorNever;
      _statusLabel.text = @"Behavior: Never";
      break;
    case kGMSMapViewPaddingAdjustmentBehaviorNever:
      _mapView.paddingAdjustmentBehavior = kGMSMapViewPaddingAdjustmentBehaviorAlways;
      _statusLabel.text = @"Behavior: Always";
      break;
  }
}

@end
