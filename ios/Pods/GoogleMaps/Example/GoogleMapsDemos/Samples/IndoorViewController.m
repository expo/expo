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

#import "GoogleMapsDemos/Samples/IndoorViewController.h"

#import <GoogleMaps/GoogleMaps.h>

static NSString *const kNormalType = @"Normal";
static NSString *const kRetroType = @"Retro";
static NSString *const kGrayscaleType = @"Grayscale";
static NSString *const kNightType = @"Night";

@interface IndoorViewController () <UIActionSheetDelegate>
@end

@implementation IndoorViewController {
  GMSMapView *_mapView;
  UIBarButtonItem *_barButtonItem;
  GMSMapStyle *_retroStyle;
  GMSMapStyle *_grayscaleStyle;
  GMSMapStyle *_nightStyle;
}

- (void)viewDidLoad {
  [super viewDidLoad];

  NSURL *retroURL = [[NSBundle mainBundle] URLForResource:@"mapstyle-retro" withExtension:@"json"];
  _retroStyle = [GMSMapStyle styleWithContentsOfFileURL:retroURL error:NULL];

  NSURL *grayscaleURL = [[NSBundle mainBundle] URLForResource:@"mapstyle-silver"
                                                withExtension:@"json"];
  _grayscaleStyle = [GMSMapStyle styleWithContentsOfFileURL:grayscaleURL error:NULL];

  NSURL *nightURL = [[NSBundle mainBundle] URLForResource:@"mapstyle-night" withExtension:@"json"];
  _nightStyle = [GMSMapStyle styleWithContentsOfFileURL:nightURL error:NULL];

  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:37.78318
                                                          longitude:-122.403874
                                                               zoom:18];

  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  _mapView.settings.myLocationButton = YES;

  UIBarButtonItem *styleButton = [[UIBarButtonItem alloc] initWithTitle:@"Style"
                                                                  style:UIBarButtonItemStylePlain
                                                                 target:self
                                                                 action:@selector(changeMapStyle:)];
  self.navigationItem.rightBarButtonItem = styleButton;

  self.view = _mapView;
}

- (UIAlertAction *_Nonnull)actionWithTitle:(nonnull NSString *)title
                                     style:(nullable GMSMapStyle *)style {
  __weak __typeof__(self) weakSelf = self;
  return [UIAlertAction actionWithTitle:title
                                  style:UIAlertActionStyleDefault
                                handler:^(UIAlertAction *_Nonnull action) {
                                  __strong __typeof__(self) strongSelf = weakSelf;
                                  if (strongSelf) {
                                    strongSelf->_mapView.mapStyle = style;
                                  }
                                }];
}

- (void)changeMapStyle:(UIBarButtonItem *)sender {
  UIAlertController *alert =
      [UIAlertController alertControllerWithTitle:@"Select map style"
                                          message:nil
                                   preferredStyle:UIAlertControllerStyleActionSheet];
  [alert addAction:[self actionWithTitle:kRetroType style:_retroStyle]];
  [alert addAction:[self actionWithTitle:kGrayscaleType style:_grayscaleStyle]];
  [alert addAction:[self actionWithTitle:kNightType style:_nightStyle]];
  [alert addAction:[self actionWithTitle:kNormalType style:nil]];
  [alert addAction:[UIAlertAction actionWithTitle:@"Cancel"
                                            style:UIAlertActionStyleCancel
                                          handler:nil]];
  alert.popoverPresentationController.barButtonItem = sender;
  [self presentViewController:alert animated:YES completion:nil];
}

@end
