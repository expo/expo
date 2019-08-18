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

#import "GMUCluster.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Defines a cluster where its position is fixed upon construction.
 */
@interface GMUStaticCluster : NSObject<GMUCluster>

/**
 * The default initializer is not available. Use initWithPosition: instead.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Returns a new instance of the GMUStaticCluster class defined by it's position.
 */
- (instancetype)initWithPosition:(CLLocationCoordinate2D)position NS_DESIGNATED_INITIALIZER;

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

/**
 * Adds an item to the cluster.
 */
- (void)addItem:(id<GMUClusterItem>)item;

/**
 * Removes an item to the cluster.
 */
- (void)removeItem:(id<GMUClusterItem>)item;

@end

NS_ASSUME_NONNULL_END

