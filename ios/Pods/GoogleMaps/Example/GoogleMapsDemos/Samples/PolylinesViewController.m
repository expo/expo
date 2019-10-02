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

#import "GoogleMapsDemos/Samples/PolylinesViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@interface GMSPolyline (length)

@property(nonatomic, readonly) double length;

@end

@implementation GMSPolyline (length)

- (double)length {
  GMSLengthKind kind = [self geodesic] ? kGMSLengthGeodesic : kGMSLengthRhumb;
  return [[self path] lengthOfKind:kind];
}

@end

static CLLocationCoordinate2D kSydneyAustralia = {-33.866901, 151.195988};
static CLLocationCoordinate2D kHawaiiUSA = {21.291982, -157.821856};
static CLLocationCoordinate2D kFiji = {-18, 179};
static CLLocationCoordinate2D kMountainViewUSA = {37.423802, -122.091859};
static CLLocationCoordinate2D kLimaPeru = {-12, -77};
static bool kAnimate = true;

@implementation PolylinesViewController {
  NSArray *_styles;
  NSArray *_lengths;
  NSArray *_polys;
  double _pos, _step;
  GMSMapView *_mapView;
}

- (void)tick {
  for (GMSPolyline *poly in _polys) {
    poly.spans =
        GMSStyleSpansOffset(poly.path, _styles, _lengths, kGMSLengthGeodesic, _pos);
  }
  _pos -= _step;
  if (kAnimate) {
    __weak id weakSelf = self;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC / 10),
                   dispatch_get_main_queue(),
                   ^{ [weakSelf tick]; });
  }
}

- (void)initLines {
  if (!_polys) {
    NSMutableArray *polys = [NSMutableArray array];
    GMSMutablePath *path = [GMSMutablePath path];
    [path addCoordinate:kSydneyAustralia];
    [path addCoordinate:kFiji];
    [path addCoordinate:kHawaiiUSA];
    [path addCoordinate:kMountainViewUSA];
    [path addCoordinate:kLimaPeru];
    [path addCoordinate:kSydneyAustralia];
    path = [path pathOffsetByLatitude:-30 longitude:0];
    _lengths = @[@([path lengthOfKind:kGMSLengthGeodesic] / 21)];
    for (int i = 0; i < 30; ++i) {
      GMSPolyline *poly = [[GMSPolyline alloc] init];
      poly.path = [path pathOffsetByLatitude:(i * 1.5) longitude:0];
      poly.strokeWidth = 8;
      poly.geodesic = YES;
      poly.map = _mapView;
      [polys addObject:poly];
    }
    _polys = polys;
  }
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:-30
                                                          longitude:-175
                                                               zoom:3];
  GMSMapView *mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  mapView.accessibilityElementsHidden = YES;
  self.view = mapView;
  _mapView = mapView;

  CGFloat alpha = 1;
  UIColor *green = [UIColor colorWithRed:0 green:1 blue: 0 alpha:alpha];
  UIColor *greenTransp = [UIColor colorWithRed:0 green:1 blue: 0 alpha:0];
  UIColor *red = [UIColor colorWithRed:1 green:0 blue: 0 alpha:alpha];
  UIColor *redTransp = [UIColor colorWithRed:1 green:0 blue: 0 alpha:0];
  GMSStrokeStyle *grad1 = [GMSStrokeStyle gradientFromColor:green toColor:greenTransp];
  GMSStrokeStyle *grad2 = [GMSStrokeStyle gradientFromColor:redTransp toColor:red];
  _styles = @[
              grad1,
              grad2,
              [GMSStrokeStyle solidColor:[UIColor colorWithWhite:0 alpha:0]],
              ];
  _step = 50000;
  [self initLines];
  [self tick];
}

@end
