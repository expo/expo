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

#import "GQTPointQuadTree.h"
#import "GQTPointQuadTreeChild.h"

@implementation GQTPointQuadTree {
  /**
   * The bounds of this PointQuadTree.
   */
  GQTBounds bounds_;

  /**
   * The Quad Tree data structure.
   */
  GQTPointQuadTreeChild *root_;

  /**
   * The number of items in this tree.
   */
  NSUInteger count_;
}


- (id)initWithBounds:(GQTBounds)bounds {
  if (self = [super init]) {
    bounds_ = bounds;
    [self clear];
  }
  return self;
}

- (id)init {
  return [self initWithBounds:(GQTBounds){-1, -1, 1, 1}];
}

- (BOOL)add:(id<GQTPointQuadTreeItem>)item {
  if (item == nil) {
    // Item must not be nil.
    return NO;
  }

  GQTPoint point = item.point;
  if (point.x > bounds_.maxX ||
      point.x < bounds_.minX ||
      point.y > bounds_.maxY ||
      point.y < bounds_.minY) {
    return NO;
  }

  [root_ add:item withOwnBounds:bounds_ atDepth:0];

  ++count_;

  return YES;
}

/**
 * Delete an item from this PointQuadTree
 *
 * @param item The item to delete.
 */
- (BOOL)remove:(id<GQTPointQuadTreeItem>)item {
  GQTPoint point = item.point;
  if (point.x > bounds_.maxX ||
      point.x < bounds_.minX ||
      point.y > bounds_.maxY ||
      point.y < bounds_.minY) {
    return NO;
  }

  BOOL removed = [root_ remove:item withOwnBounds:bounds_];

  if (removed) {
    --count_;
  }

  return removed;
}

/**
 * Delete all items from this PointQuadTree
 */
- (void)clear {
  root_ = [[GQTPointQuadTreeChild alloc] init];
  count_ = 0;
}

/**
 * Retreive all items in this PointQuadTree within a bounding box.
 *
 * @param searchBounds The bounds of the search box.
 */
- (NSArray *)searchWithBounds:(GQTBounds)searchBounds {

  NSMutableArray *results = [NSMutableArray array];
  [root_ searchWithBounds:searchBounds withOwnBounds:bounds_ results:results];
  return results;
}

- (NSUInteger)count {
  return count_;
}

@end

