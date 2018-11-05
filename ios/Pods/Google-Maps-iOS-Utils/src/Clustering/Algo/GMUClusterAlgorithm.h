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
#import "GMUClusterItem.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Generic protocol for arranging cluster items into groups.
 */
@protocol GMUClusterAlgorithm<NSObject>

- (void)addItems:(NSArray<id<GMUClusterItem>> *)items;

/**
 * Removes an item.
 */
- (void)removeItem:(id<GMUClusterItem>)item;

/**
 * Clears all items.
 */
- (void)clearItems;

/**
 * Returns the set of clusters of the added items.
 */
- (NSArray<id<GMUCluster>> *)clustersAtZoom:(float)zoom;

@end

NS_ASSUME_NONNULL_END
