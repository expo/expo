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

#import "GMUStaticCluster.h"

@implementation GMUStaticCluster {
  NSMutableArray<id<GMUClusterItem>> *_items;
}

- (instancetype)initWithPosition:(CLLocationCoordinate2D)position {
  if ((self = [super init])) {
    _items = [[NSMutableArray alloc] init];
    _position = position;
  }
  return self;
}

- (NSUInteger)count {
  return _items.count;
}

- (NSArray<id<GMUClusterItem>> *)items {
  return [_items copy];
}

- (void)addItem:(id<GMUClusterItem>)item {
  [_items addObject:item];
}

- (void)removeItem:(id<GMUClusterItem>)item {
  [_items removeObject:item];
}

@end

