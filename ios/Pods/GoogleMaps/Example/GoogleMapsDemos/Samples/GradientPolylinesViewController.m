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

#import "GoogleMapsDemos/Samples/GradientPolylinesViewController.h"

#import <GoogleMaps/GoogleMaps.h>


@implementation GradientPolylinesViewController {
  GMSMapView *_mapView;
  GMSPolyline *_polyline;
  NSMutableArray *_trackData;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:44.1314
                                                          longitude:9.6921
                                                               zoom:14.059f
                                                            bearing:328.f
                                                       viewingAngle:40.f];
  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  self.view = _mapView;

  [self parseTrackFile];
  [_polyline setSpans:[self gradientSpans]];
}

- (NSArray *)gradientSpans {
  NSMutableArray *colorSpans = [NSMutableArray array];
  NSUInteger count = _trackData.count;
  UIColor *prevColor;
  for (NSUInteger i = 0; i < count; i++) {
    NSDictionary *dict = [_trackData objectAtIndex:i];
    double elevation = [[dict objectForKey:@"elevation"] doubleValue];

    UIColor *toColor = [UIColor colorWithHue:(float)elevation/700
                                  saturation:1.f
                                  brightness:.9f
                                       alpha:1.f];

    if (prevColor == nil) {
      prevColor = toColor;
    }

    GMSStrokeStyle *style = [GMSStrokeStyle gradientFromColor:prevColor toColor:toColor];
    [colorSpans addObject:[GMSStyleSpan spanWithStyle:style]];

    prevColor = toColor;
  }
  return colorSpans;
}

- (void)parseTrackFile {
  NSString *filePath = [[NSBundle mainBundle] pathForResource:@"track" ofType:@"json"];
  NSData *data = [NSData dataWithContentsOfFile:filePath];
  NSArray *json = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:nil];
  _trackData = [[NSMutableArray alloc] init];
  GMSMutablePath *path = [GMSMutablePath path];

  for (NSUInteger i = 0; i < json.count; i++) {
    NSDictionary *info = [json objectAtIndex:i];
    NSNumber *elevation = [info objectForKey:@"elevation"];
    CLLocationDegrees lat = [[info objectForKey:@"lat"] doubleValue];
    CLLocationDegrees lng = [[info objectForKey:@"lng"] doubleValue];
    CLLocation *loc = [[CLLocation alloc] initWithLatitude:lat longitude:lng];
    [_trackData addObject:@{@"loc": loc, @"elevation": elevation}];
    [path addLatitude:lat longitude:lng];
  }

  _polyline = [GMSPolyline polylineWithPath:path];
  _polyline.strokeWidth = 6;
  _polyline.map = _mapView;
}

@end
