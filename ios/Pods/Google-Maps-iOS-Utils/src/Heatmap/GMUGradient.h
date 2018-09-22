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

#import <UIKit/UIKIt.h>

NS_ASSUME_NONNULL_BEGIN

// Represents a mapping of intensity to color.  Interpolates between given set intensity and
// color values to produce a full mapping for the range [0, 1].
@interface GMUGradient : NSObject

// Number of entries in the generated color map.
@property(nonatomic, readonly) NSUInteger mapSize;

// The specific colors for the specific intensities specified by startPoints.
@property(nonatomic, readonly) NSArray<UIColor *> *colors;

// The intensities which will be the specific colors specified in colors.
@property(nonatomic, readonly) NSArray<NSNumber *> *startPoints;

// Designated initializer.
//
// |colors| and |startPoints| must not be empty, and must have the same number of elements.
// |startPoints| values must be in non-descending order and be float values in the range [0, 1].
// |mapSize| must be at least two. Using more than 256 * colors.count is unlikely to provide any
// quality improvement.
- (instancetype)initWithColors:(NSArray<UIColor *> *)colors
                   startPoints:(NSArray<NSNumber *> *)startPoints
                  colorMapSize:(NSUInteger)mapSize;

// Generates an array of mapSize colors for the interpolated colors for intensities between 0 and 1
// inclusive.
// If the provided startPoints do not cover the range 0 to 1, lower values interpolate towards
// transparent black and higher values repeat the last provided color.
- (NSArray<UIColor *> *)generateColorMap;

@end

NS_ASSUME_NONNULL_END
