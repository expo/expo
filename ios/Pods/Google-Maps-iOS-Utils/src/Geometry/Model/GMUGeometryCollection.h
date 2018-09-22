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

#import <Foundation/Foundation.h>

#import "GMUGeometry.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Instances of this class represent a GeometryCollection object.
 */
@interface GMUGeometryCollection : NSObject<GMUGeometry>

/**
 * The array of geometry objects for the GeometryCollection.
 */
@property(nonatomic, readonly) NSArray<id<GMUGeometry>> *geometries;

/**
 * Initializes a GMUGeometryCollection object with a set of geometry objects.
 *
 * @param geometries The array of geometry objects.
 */
- (instancetype)initWithGeometries:(NSArray<id<GMUGeometry>> *)geometries;

@end

NS_ASSUME_NONNULL_END
