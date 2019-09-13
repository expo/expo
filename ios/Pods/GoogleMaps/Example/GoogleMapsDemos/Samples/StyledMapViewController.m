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

#import "GoogleMapsDemos/Samples/StyledMapViewController.h"

#import <GoogleMaps/GoogleMaps.h>

static NSString *const kNormalType = @"Normal";
static NSString *const kRetroType = @"Retro";
static NSString *const kGrayscaleType = @"Grayscale";
static NSString *const kNightType = @"Night";
static NSString *const kNoPOIsType = @"No business points of interest, no transit";

@implementation StyledMapViewController {
  UIBarButtonItem *_barButtonItem;
  GMSMapView *_mapView;
  GMSMapStyle *_retroStyle;
  GMSMapStyle *_grayscaleStyle;
  GMSMapStyle *_nightStyle;
  GMSMapStyle *_noPOIsStyle;
}

- (void)viewDidLoad {
  [super viewDidLoad];

  // Error handling is skipped here for brevity, however it is recommended that you look at the
  // error returned from |styleWithContentsOfFileURL:error:| if it returns nil. This error will
  // provide information on why your style was not able to be loaded.

  NSURL *retroURL = [[NSBundle mainBundle] URLForResource:@"mapstyle-retro"
                                            withExtension:@"json"];
  _retroStyle = [GMSMapStyle styleWithContentsOfFileURL:retroURL error:NULL];

  NSURL *grayscaleURL = [[NSBundle mainBundle] URLForResource:@"mapstyle-silver"
                                                withExtension:@"json"];
  _grayscaleStyle = [GMSMapStyle styleWithContentsOfFileURL:grayscaleURL error:NULL];

  NSURL *nightURL = [[NSBundle mainBundle] URLForResource:@"mapstyle-night"
                                            withExtension:@"json"];
  _nightStyle = [GMSMapStyle styleWithContentsOfFileURL:nightURL error:NULL];

  NSString *noPOIsString = @" [\n"
      "  {\n"
      "  \"featureType\": \"poi.business\",\n"
      "  \"elementType\": \"all\",\n"
      "  \"stylers\": [\n"
      "              {\n"
      "              \"visibility\": \"off\"\n"
      "              }\n"
      "              ]\n"
      "  },\n"
      "  {\n"
      "  \"featureType\": \"transit\",\n"
      "  \"elementType\": \"all\",\n"
      "  \"stylers\": [\n"
      "              {\n"
      "              \"visibility\": \"off\"\n"
      "              }\n"
      "              ]\n"
      "  }\n"
      "  ]";
  _noPOIsStyle = [GMSMapStyle styleWithJSONString:noPOIsString error:NULL];

  GMSCameraPosition *camera =
      [GMSCameraPosition cameraWithLatitude:-33.868 longitude:151.2086 zoom:12];

  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  self.view = _mapView;

  _mapView.mapStyle = _retroStyle;

  UIBarButtonItem *styleButton = [[UIBarButtonItem alloc] initWithTitle:@"Style"
                                                                  style:UIBarButtonItemStylePlain
                                                                 target:self
                                                                 action:@selector(changeMapStyle:)];
  self.navigationItem.rightBarButtonItem = styleButton;
  self.navigationItem.title = kRetroType;
}

- (UIAlertAction *_Nonnull)actionWithTitle:(nonnull NSString *)title
                                     style:(nullable GMSMapStyle *)style {
  __weak typeof(self) weakSelf = self;
  return [UIAlertAction actionWithTitle:title
                                  style:UIAlertActionStyleDefault
                                handler:^(UIAlertAction *_Nonnull action) {
                                  __strong typeof(self) strongSelf = weakSelf;
                                  if (strongSelf) {
                                    strongSelf->_mapView.mapStyle = style;
                                    strongSelf.navigationItem.title = title;
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
  [alert addAction:[self actionWithTitle:kNoPOIsType style:_noPOIsStyle]];
  [alert addAction:[UIAlertAction actionWithTitle:@"Cancel"
                                            style:UIAlertActionStyleCancel
                                          handler:nil]];
  alert.popoverPresentationController.barButtonItem = sender;
  [self presentViewController:alert animated:YES completion:nil];
}

@end
