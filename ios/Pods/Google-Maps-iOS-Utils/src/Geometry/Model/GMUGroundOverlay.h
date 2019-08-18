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
 * Instances of this class represent a Ground Overlay object.
 */
@interface GMUGroundOverlay : NSObject<GMUGeometry>

/**
 * The North-East corner of the overlay.
 */
@property(nonatomic, readonly) CLLocationCoordinate2D northEast;

/**
 * The South-West corner of the overlay.
 */
@property(nonatomic, readonly) CLLocationCoordinate2D southWest;

/**
 * The Z-Index of the overlay.
 */
@property(nonatomic, readonly) int zIndex;

/**
 * The rotation of the overlay on the map.
 */
@property(nonatomic, readonly) double rotation;

/**
 * The image to be rendered on the overlay.
 */
@property(nonatomic, readonly) NSString *href;

/**
 * Initializes a GMUGroundOverlay object.
 *
 * @param northEast The North-East corner of the overlay.
 * @param southWest The South-West corner of the overlay.
 * @param zIndex The Z-Index of the overlay.
 * @param rotation The rotation of the overlay.
 * @param href The image to be rendered on the overlay.
 */
- (instancetype)initWithCoordinate:(CLLocationCoordinate2D)northEast
                         southWest:(CLLocationCoordinate2D)southWest
                            zIndex:(int)zIndex
                          rotation:(double)rotation
                              href:(NSString *)href;

@end

NS_ASSUME_NONNULL_END
