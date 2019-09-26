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

#import "GoogleMapsDemos/Samples/TileLayerViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@implementation TileLayerViewController {
  UISegmentedControl *_switcher;
  GMSMapView *_mapView;
  GMSTileLayer *_tileLayer;
  NSInteger _floor;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:37.78318
                                                          longitude:-122.403874
                                                               zoom:18];

  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  _mapView.buildingsEnabled = NO;
  _mapView.indoorEnabled = NO;
  self.view = _mapView;

  // The possible floors that might be shown.
  NSArray *types = @[ @"1", @"2", @"3" ];

  // Create a UISegmentedControl that is the navigationItem's titleView.
  _switcher = [[UISegmentedControl alloc] initWithItems:types];
  _switcher.selectedSegmentIndex = 0;
  _switcher.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  _switcher.frame =
      CGRectMake(0, 0, 300, _switcher.frame.size.height);
  self.navigationItem.titleView = _switcher;

  // Listen to touch events on the UISegmentedControl, force initial update.
  [_switcher addTarget:self action:@selector(didChangeSwitcher)
      forControlEvents:UIControlEventValueChanged];
  [self didChangeSwitcher];
}

- (void)didChangeSwitcher {
  NSString *title =
      [_switcher titleForSegmentAtIndex:_switcher.selectedSegmentIndex];
  NSInteger floor = [title integerValue];
  if (_floor != floor) {
    // Clear existing tileLayer, if any.
    _tileLayer.map = nil;

    // Create a new GMSTileLayer with the new floor choice.
    GMSTileURLConstructor urls = ^(NSUInteger x, NSUInteger y, NSUInteger zoom) {
      NSString *url = [NSString
          stringWithFormat:@"https://www.gstatic.com/io2010maps/tiles/9/L%ld_%lu_%lu_%lu.png",
                           (long)floor, (unsigned long)zoom, (unsigned long)x, (unsigned long)y];
      return [NSURL URLWithString:url];
    };
    _tileLayer = [GMSURLTileLayer tileLayerWithURLConstructor:urls];
    _tileLayer.map = _mapView;
    _floor = floor;
  }
}

@end
