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

#import "GoogleMapsDemos/Samples/SnapshotReadyViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@interface SnapshotReadyViewController ()<GMSMapViewDelegate>
@end

@implementation SnapshotReadyViewController {
  GMSMapView *_mapView;
  UILabel *_statusLabel;
  UIBarButtonItem *_waitButton;
  BOOL _isAwaitingSnapshot;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera =
      [GMSCameraPosition cameraWithLatitude:-33.868 longitude:151.2086 zoom:6];
  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  _mapView.delegate = self;
  self.view = _mapView;

  // Add status label, initially hidden.
  _statusLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, 0, 30)];
  _statusLabel.alpha = 0.0f;
  _statusLabel.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  _statusLabel.backgroundColor = [UIColor blueColor];
  _statusLabel.textColor = [UIColor whiteColor];
  _statusLabel.textAlignment = NSTextAlignmentCenter;

  // Add a wait button to signify on the next SnapshotReady event, a screenshot of the map will
  // be taken.
  _waitButton = [[UIBarButtonItem alloc] initWithTitle:@"Wait for snapshot"
                                                 style:UIBarButtonItemStylePlain
                                                target:self
                                                action:@selector(didTapWait)];
  self.navigationItem.rightBarButtonItems = @[ _waitButton ];
  [_mapView addSubview:_statusLabel];
}

#pragma mark GMSMapViewDelegate

- (void)mapViewSnapshotReady:(GMSMapView *)mapView {
  if (_isAwaitingSnapshot) {
    _isAwaitingSnapshot = NO;
    _waitButton.enabled = YES;
    _waitButton.title = @"Wait for snapshot";
    [self takeSnapshot];
  }

  _statusLabel.alpha = 0.8f;
  _statusLabel.text = @"Snapshot Ready";
  // Remove status label after 1 second.
  UILabel *statusLabel = _statusLabel;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
    statusLabel.alpha = 0.0f;
  });
}

#pragma mark Private

- (void)didTapWait {
  _isAwaitingSnapshot = YES;
  _waitButton.enabled = NO;
  _waitButton.title = @"Waiting";
}

- (void)takeSnapshot {
  // Take a snapshot of the map.
  UIGraphicsBeginImageContextWithOptions(_mapView.bounds.size, YES, 0);
  [_mapView drawViewHierarchyInRect:_mapView.bounds afterScreenUpdates:YES];
  UIImage *mapSnapShot = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();

  // Put snapshot image into an UIImageView and overlay on top of map.
  UIImageView *imageView = [[UIImageView alloc] initWithImage:mapSnapShot];
  imageView.layer.borderColor = [UIColor redColor].CGColor;
  imageView.layer.borderWidth = 10.0f;
  [_mapView addSubview:imageView];

  // Remove imageView after 1 second.
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
    [UIView animateWithDuration:1
        animations:^{
          imageView.alpha = 0.0f;
        }
        completion:^(BOOL finished) {
          [imageView removeFromSuperview];
        }];
  });
}

@end
