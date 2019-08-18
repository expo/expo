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

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GMUSimpleClusterAlgorithm.h"

#import "GMUStaticCluster.h"
#import "GMUClusterItem.h"

static const NSUInteger kClusterCount = 10;

@implementation GMUSimpleClusterAlgorithm {
  NSMutableArray<id<GMUClusterItem>> *_items;
}

- (instancetype)init {
  if ((self = [super init])) {
    _items = [[NSMutableArray alloc] init];
  }
  return self;
}

- (void)addItems:(NSArray<id<GMUClusterItem>> *)items {
  [_items addObjectsFromArray:items];
}

- (void)removeItem:(id<GMUClusterItem>)item {
  [_items removeObject:item];
}

- (void)clearItems {
  [_items removeAllObjects];
}

- (NSArray<id<GMUCluster>> *)clustersAtZoom:(float)zoom {
  NSMutableArray<id<GMUCluster>> *clusters =
      [[NSMutableArray alloc] initWithCapacity:kClusterCount];

  for (int i = 0; i < kClusterCount; ++i) {
    if (i >= _items.count) break;
    id<GMUClusterItem> item = _items[i];
    [clusters addObject:[[GMUStaticCluster alloc] initWithPosition:item.position]];
  }

  NSUInteger clusterIndex = 0;
  for (int i = kClusterCount; i < _items.count; ++i) {
    id<GMUClusterItem> item = _items[i];
    GMUStaticCluster *cluster = clusters[clusterIndex % kClusterCount];
    [cluster addItem:item];
    ++clusterIndex;
  }
  return clusters;
}

@end

