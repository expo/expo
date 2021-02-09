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

#import "GoogleMapsDemos/Samples/MarkerLayerViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@interface CoordsList : NSObject
@property(nonatomic, readonly, copy) GMSPath *path;
@property(nonatomic, readonly) NSUInteger target;

- (id)initWithPath:(GMSPath *)path;

- (CLLocationCoordinate2D)next;

@end

@implementation CoordsList

- (id)initWithPath:(GMSPath *)path {
  if ((self = [super init])) {
    _path = [path copy];
    _target = 0;
  }
  return self;
}

- (CLLocationCoordinate2D)next {
  ++_target;
  if (_target == _path.count) {
    _target = 0;
  }
  return [_path coordinateAtIndex:_target];
}

@end

@implementation MarkerLayerViewController {
  GMSMapView *_mapView;
  GMSMarker *_fadedMarker;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  _mapView = [[GMSMapView alloc] init];
  _mapView.camera = [GMSCameraPosition cameraWithLatitude:50.6042 longitude:3.9599 zoom:5];
  _mapView.delegate = self;
  self.view = _mapView;

  GMSMutablePath *coords;
  GMSMarker *marker;

  // Create a plane that flies to several airports around western Europe.
  coords = [GMSMutablePath path];
  [coords addLatitude:52.310683 longitude:4.765121];
  [coords addLatitude:51.471386 longitude:-0.457148];
  [coords addLatitude:49.01378 longitude:2.5542943];
  [coords addLatitude:50.036194 longitude:8.554519];
  marker = [GMSMarker markerWithPosition:[coords coordinateAtIndex:0]];
  marker.icon = [UIImage imageNamed:@"aeroplane"];
  marker.groundAnchor = CGPointMake(0.5f, 0.5f);
  marker.flat = YES;
  marker.map = _mapView;
  marker.userData = [[CoordsList alloc] initWithPath:coords];
  [self animateToNextCoord:marker];

  // Create a boat that moves around the Baltic Sea.
  coords = [GMSMutablePath path];
  [coords addLatitude:57.598335 longitude:11.290512];
  [coords addLatitude:55.665193 longitude:10.741196];
  [coords addLatitude:55.065787 longitude:11.083488];
  [coords addLatitude:54.699234 longitude:10.863762];
  [coords addLatitude:54.482805 longitude:12.061272];
  [coords addLatitude:55.819802 longitude:16.148186];  // final point
  [coords addLatitude:54.927142 longitude:16.455803];  // final point
  [coords addLatitude:54.482805 longitude:12.061272];  // and back again
  [coords addLatitude:54.699234 longitude:10.863762];
  [coords addLatitude:55.065787 longitude:11.083488];
  [coords addLatitude:55.665193 longitude:10.741196];
  marker = [GMSMarker markerWithPosition:[coords coordinateAtIndex:0]];
  marker.icon = [UIImage imageNamed:@"boat"];
  marker.map = _mapView;
  marker.userData = [[CoordsList alloc] initWithPath:coords];
  [self animateToNextCoord:marker];
}

- (void)animateToNextCoord:(GMSMarker *)marker {
  CoordsList *coords = marker.userData;
  CLLocationCoordinate2D coord = [coords next];
  CLLocationCoordinate2D previous = marker.position;

  CLLocationDirection heading = GMSGeometryHeading(previous, coord);
  CLLocationDistance distance = GMSGeometryDistance(previous, coord);

  // Use CATransaction to set a custom duration for this animation. By default, changes to the
  // position are already animated, but with a very short default duration. When the animation is
  // complete, trigger another animation step.

  [CATransaction begin];
  [CATransaction setAnimationDuration:(distance / (50 * 1000))];  // custom duration, 50km/sec

  __weak MarkerLayerViewController *weakSelf = self;
  [CATransaction setCompletionBlock:^{
    [weakSelf animateToNextCoord:marker];
  }];

  marker.position = coord;

  [CATransaction commit];

  // If this marker is flat, implicitly trigger a change in rotation, which will finish quickly.
  if (marker.flat) {
    marker.rotation = heading;
  }
}

- (void)fadeMarker:(GMSMarker *)marker {
  _fadedMarker.opacity = 1.0f;  // reset previous faded marker

  // Fade this new marker.
  _fadedMarker = marker;
  _fadedMarker.opacity = 0.5f;
}

#pragma mark - GMSMapViewDelegate

- (BOOL)mapView:(GMSMapView *)mapView didTapMarker:(GMSMarker *)marker {
  [self fadeMarker:marker];
  return YES;
}

- (void)mapView:(GMSMapView *)mapView didTapAtCoordinate:(CLLocationCoordinate2D)coordinate {
  [self fadeMarker:nil];
}

@end
