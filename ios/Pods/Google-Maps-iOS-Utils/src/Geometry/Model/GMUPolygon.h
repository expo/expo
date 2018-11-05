/* Copyright (c) 2016 Google Inc.
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

#import <CoreLocation/CoreLocation.h>
#import <Foundation/Foundation.h>
#import <GoogleMaps/GoogleMaps.h>

#import "GMUGeometry.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Instances of this class represent a Polygon object.
 */
@interface GMUPolygon : NSObject<GMUGeometry>

/**
 * The array of LinearRing paths for the Polygon. The first is the exterior ring of the Polygon; any
 * subsequent rings are holes.
 */
@property(nonatomic, readonly) NSArray<GMSPath *> *paths;

/**
 * Initializes a GMUGeoJSONPolygon object with a set of paths.
 *
 * @param paths The paths of the Polygon.
 */
- (instancetype)initWithPaths:(NSArray<GMSPath *> *)paths;

@end

NS_ASSUME_NONNULL_END
