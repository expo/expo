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

#import "GoogleMapsDemos/Samples/CustomIndoorViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@interface CustomIndoorViewController () <
  GMSIndoorDisplayDelegate,
  UIPickerViewDelegate,
  UIPickerViewDataSource>

@end

@implementation CustomIndoorViewController {
  GMSMapView *_mapView;
  UIPickerView *_levelPickerView;
  NSArray *_levels;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:37.78318
                                                          longitude:-122.403874
                                                               zoom:18];

  // set backgroundColor, otherwise UIPickerView fades into the background
  self.view.backgroundColor = [UIColor grayColor];

  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  _mapView.settings.myLocationButton = NO;
  _mapView.settings.indoorPicker = NO; // We are implementing a custom level picker.

  _mapView.indoorEnabled = YES; // Defaults to YES. Set to NO to hide indoor maps.
  _mapView.indoorDisplay.delegate = self;
  _mapView.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:_mapView];

  // This UIPickerView will be populated with the levels of the active building.
  _levelPickerView = [[UIPickerView alloc] init];
  _levelPickerView.delegate = self;
  _levelPickerView.dataSource = self;
  _levelPickerView.showsSelectionIndicator = YES;
  _levelPickerView.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:_levelPickerView];

  // The height of the UIPickerView, used below in the vertical constraint
  NSDictionary *metrics = @{@"height": @180.0};
  NSDictionary *views = NSDictionaryOfVariableBindings(_mapView, _levelPickerView);

  // Constraining the map to the full width of the display.
  // The |_levelPickerView| is constrained below with the NSLayoutFormatAlignAll*
  // See http://developer.apple.com/library/ios/documentation/UserExperience/Conceptual/AutolayoutPG/Articles/formatLanguage.html
  [self.view addConstraints:[NSLayoutConstraint
                             constraintsWithVisualFormat:@"|[_mapView]|"
                             options:0
                             metrics:metrics
                             views:views]];

  // Constraining the _mapView and the _levelPickerView as siblings taking
  // the full height of the display, with _levelPickerView at 200 points high
  [self.view addConstraints:[NSLayoutConstraint
                             constraintsWithVisualFormat:@"V:|[_mapView][_levelPickerView(height)]|"
                             options:NSLayoutFormatAlignAllLeft|NSLayoutFormatAlignAllRight
                             metrics:metrics
                             views:views]];
}

#pragma mark - GMSIndoorDisplayDelegate

- (void)didChangeActiveBuilding:(GMSIndoorBuilding *)building {
  // Everytime we change active building force the picker to re-display the labels.

  NSMutableArray *levels = [NSMutableArray array];
  if (building.underground) {
    // If this building is completely underground, add a fake 'top' floor. This must be the 'boxed'
    // nil, [NSNull null], as NSArray/NSMutableArray cannot contain nils.
    [levels addObject:[NSNull null]];
  }
  [levels addObjectsFromArray:building.levels];
  _levels = [levels copy];

  [_levelPickerView reloadAllComponents];
  [_levelPickerView selectRow:-1 inComponent:0 animated:NO];

  // UIPickerView insists on having some data; disable interaction if there's no levels.
  _levelPickerView.userInteractionEnabled = (_levels.count > 0);
}

- (void)didChangeActiveLevel:(GMSIndoorLevel *)level {
  // On level change, sync our level picker's selection to the IndoorDisplay.
  if (level == nil) {
    level = (id)[NSNull null];  // box nil to NSNull for use in NSArray
  }
  NSUInteger index = [_levels indexOfObject:level];
  if (index != NSNotFound) {
    NSInteger currentlySelectedLevel = [_levelPickerView selectedRowInComponent:0];
    if ((NSInteger)index != currentlySelectedLevel) {
      [_levelPickerView selectRow:index inComponent:0 animated:NO];
    }
  }
}

#pragma mark - UIPickerViewDelegate

- (void)pickerView:(UIPickerView *)pickerView
      didSelectRow:(NSInteger)row
       inComponent:(NSInteger)component {
  // On user selection of a level in the picker, set the right level in IndoorDisplay
  id level = _levels[row];
  if (level == [NSNull null]) {
    level = nil;  // unbox NSNull
  }
  [_mapView.indoorDisplay setActiveLevel:level];
}

- (NSString *)pickerView:(UIPickerView *)pickerView
             titleForRow:(NSInteger)row
            forComponent:(NSInteger)component {
  id object = _levels[row];
  if (object == [NSNull null]) {
    return @"\u2014";  // use an em dash for 'above ground'
  }
  GMSIndoorLevel *level = object;
  return level.name;
}

#pragma mark - UIPickerViewDataSource

- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView {
  return 1;
}

- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent:(NSInteger)component {
  return _levels.count;
}

@end
