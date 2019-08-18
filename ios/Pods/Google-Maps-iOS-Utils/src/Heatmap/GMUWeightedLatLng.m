/* Copyright (c) 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GMUWeightedLatLng.h"

#import <GoogleMaps/GoogleMaps.h>

@implementation GMUWeightedLatLng {
  GQTPoint _point;
}

- (instancetype)initWithCoordinate:(CLLocationCoordinate2D)coordinate intensity:(float)intensity {
  if ((self = [super init])) {
    _intensity = intensity;
    GMSMapPoint mapPoint = GMSProject(coordinate);
    _point.x = mapPoint.x;
    _point.y = mapPoint.y;
  }
  return self;
}

- (GQTPoint)point {
  return _point;
}

@end
