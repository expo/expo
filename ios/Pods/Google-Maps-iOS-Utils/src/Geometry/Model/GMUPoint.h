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

#import "GMUGeometry.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Instances of this class represent a Point object.
 */
@interface GMUPoint : NSObject<GMUGeometry>

/**
 * The 2D coordinate of the Point, containing a latitude and longitude.
 */
@property(nonatomic, readonly) CLLocationCoordinate2D coordinate;

/**
 * Initializes a GMUPoint object with a coordinate.
 *
 * @param coordinate A location with a latitude and longitude.
 */
- (instancetype)initWithCoordinate:(CLLocationCoordinate2D)coordinate;

@end

NS_ASSUME_NONNULL_END
