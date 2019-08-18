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

#import "GoogleMapsDemos/Samples/StyledMapViewController.h"

#import <GoogleMaps/GoogleMaps.h>

static NSString *const kNormalType = @"Normal";
static NSString *const kRetroType = @"Retro";
static NSString *const kGrayscaleType = @"Grayscale";
static NSString *const kNightType = @"Night";
static NSString *const kNoPOIsType = @"No business points of interest, no transit";

@interface StyledMapViewController ()<UIActionSheetDelegate>
@end

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

- (void)changeMapStyle:(UIBarButtonItem *)sender {
  UIActionSheet *actionSheet = [[UIActionSheet alloc]
               initWithTitle:@"Select map style"
                    delegate:self
           cancelButtonTitle:nil
      destructiveButtonTitle:nil
           otherButtonTitles:kRetroType, kGrayscaleType, kNightType, kNormalType, kNoPOIsType, nil];
  [actionSheet showFromBarButtonItem:sender animated:YES];
}

#pragma mark - UIActionSheetDelegate

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex {
  switch (buttonIndex) {
    case 0:
      _mapView.mapStyle = _retroStyle;
      self.navigationItem.title = kRetroType;
      break;
    case 1:
      _mapView.mapStyle = _grayscaleStyle;
      self.navigationItem.title = kGrayscaleType;
      break;
    case 2:
      _mapView.mapStyle = _nightStyle;
      self.navigationItem.title = kNightType;
      break;
    case 3:
      _mapView.mapStyle = nil;
      self.navigationItem.title = kNormalType;
      break;
    case 4:
      _mapView.mapStyle = _noPOIsStyle;
      self.navigationItem.title = kNoPOIsType;
      break;
    default:
      break;
  }
}

@end
