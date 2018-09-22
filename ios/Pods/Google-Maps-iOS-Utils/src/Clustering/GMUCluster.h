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

#import "GMUClusterItem.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Defines a generic cluster object.
 */
@protocol GMUCluster <NSObject>

/**
 * Returns the position of the cluster.
 */
@property(nonatomic, readonly) CLLocationCoordinate2D position;

/**
 * Returns the number of items in the cluster.
 */
@property(nonatomic, readonly) NSUInteger count;

/**
 * Returns a copy of the list of items in the cluster.
 */
@property(nonatomic, readonly) NSArray<id<GMUClusterItem>> *items;

@end

NS_ASSUME_NONNULL_END

