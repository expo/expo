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

#import "GoogleMapsDemos/Samples/FrameRateViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@interface FrameRateViewController ()

@end

@implementation FrameRateViewController {
  GMSMapView *_mapView;
  UITextView *_statusTextView;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera =
      [GMSCameraPosition cameraWithLatitude:-33.868 longitude:151.2086 zoom:6];
  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  self.view = _mapView;

  // Add a display for the current frame rate mode.
  _statusTextView = [[UITextView alloc] init];
  _statusTextView.frame = CGRectMake(0, 0, CGRectGetWidth(self.view.frame), 0);
  _statusTextView.text = @"";
  _statusTextView.textAlignment = NSTextAlignmentCenter;
  _statusTextView.backgroundColor = [UIColor colorWithWhite:1.0 alpha:0.8f];
  _statusTextView.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  _statusTextView.editable = NO;
  [self.view addSubview:_statusTextView];
  [_statusTextView sizeToFit];

  // Add a button toggling through modes.
  self.navigationItem.rightBarButtonItem =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemPlay
                                                    target:self
                                                    action:@selector(didTapNext)];
  [self updateStatus];
}

- (void)didTapNext {
  _mapView.preferredFrameRate = [self nextFrameRate];
  [self updateStatus];
}

+ (NSString *)nameForFrameRate:(GMSFrameRate)frameRate {
  switch (frameRate) {
    case kGMSFrameRatePowerSave:
      return @"PowerSave";
    case kGMSFrameRateConservative:
      return @"Conservative";
    case kGMSFrameRateMaximum:
      return @"Maximum";
  }
}

- (GMSFrameRate)nextFrameRate {
  switch (_mapView.preferredFrameRate) {
    case kGMSFrameRatePowerSave:
      return kGMSFrameRateConservative;
    case kGMSFrameRateConservative:
      return kGMSFrameRateMaximum;
    case kGMSFrameRateMaximum:
      return kGMSFrameRatePowerSave;
  }
}

- (void)updateStatus {
  _statusTextView.text =
      [NSString stringWithFormat:@"Preferred frame rate: %@",
                                 [self.class nameForFrameRate:_mapView.preferredFrameRate]];
}

@end
