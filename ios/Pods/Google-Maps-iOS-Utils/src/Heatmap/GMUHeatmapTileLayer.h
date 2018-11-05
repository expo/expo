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

#import <GoogleMaps/GoogleMaps.h>

#import "GMUGradient.h"
#import "GMUWeightedLatLng.h"

NS_ASSUME_NONNULL_BEGIN

// A tile layer which renders a heat map.
// The heat map uses convolutional smoothing of specific raidus with weighted data points in
// combination with a gradient which maps intensity to colors to dynamically generate tiles.
// Note: tiles are loaded on background threads, but the configuration properties are non-atomic.
// To ensure consistency, the configuration properties are captured when changing the map property.
// In order to change the values of a live layer, the map property must be reset.
//
// Overrides the default value for opacity to be 0.7 and sets the tile size to 512.  Changing the
// tile size is not supported.
@interface GMUHeatmapTileLayer : GMSSyncTileLayer

// Positions and individual intensitites of the data which will be smoothed for display on the
// tiles.
@property(nonatomic, copy) NSArray<GMUWeightedLatLng *> *weightedData;

// Radius of smoothing.
// Larger values smooth the data out over a larger area, but also have a greater cost for generating
// tiles.
// It is not recommended to set this to a value greater than 50.
@property(nonatomic) NSUInteger radius;

// The gradient used to map smoothed intensities to colors in the tiles.
@property(nonatomic) GMUGradient *gradient;

@end

NS_ASSUME_NONNULL_END
