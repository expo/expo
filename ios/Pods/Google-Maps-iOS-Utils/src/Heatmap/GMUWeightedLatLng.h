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

#import "GQTPointQuadTreeItem.h"

#import <CoreLocation/CoreLocation.h>

NS_ASSUME_NONNULL_BEGIN

// A quad tree item which represents a data point of given intensity at a given point on the earth's
// surface.
@interface GMUWeightedLatLng : NSObject<GQTPointQuadTreeItem>

// The intensity of the data point.  Scale is arbitrary but assumed to be linear. Intensity three
// should be equivalent to three co-located points of intensity one.
@property(nonatomic, readonly) float intensity;

// Designated initializer.
- (instancetype)initWithCoordinate:(CLLocationCoordinate2D)coordinate intensity:(float)intensity;

@end

NS_ASSUME_NONNULL_END
