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

#import "GQTPointQuadTreeChild.h"

static const unsigned kMaxElements = 64;
static const unsigned kMaxDepth = 30;

#include "GQTBounds.h"

static GQTPoint boundsMidpoint(GQTBounds bounds) {
  return (GQTPoint){(bounds.minX + bounds.maxX)/2, (bounds.minY + bounds.maxY)/2};
}

static GQTBounds boundsTopRightChildQuadBounds(GQTBounds parentBounds) {
  GQTPoint midPoint = boundsMidpoint(parentBounds);
  double minX = midPoint.x;
  double minY = midPoint.y;
  double maxX = parentBounds.maxX;
  double maxY = parentBounds.maxY;
  return (GQTBounds){minX, minY, maxX, maxY};
}

static GQTBounds boundsTopLeftChildQuadBounds(GQTBounds parentBounds) {
  GQTPoint midPoint = boundsMidpoint(parentBounds);
  double minX = parentBounds.minX;
  double minY = midPoint.y;
  double maxX = midPoint.x;
  double maxY = parentBounds.maxY;
  return (GQTBounds){minX, minY, maxX, maxY};
}

static GQTBounds boundsBottomRightChildQuadBounds(GQTBounds parentBounds) {
  GQTPoint midPoint = boundsMidpoint(parentBounds);
  double minX = midPoint.x;
  double minY = parentBounds.minY;
  double maxX = parentBounds.maxX;
  double maxY = midPoint.y;
  return (GQTBounds){minX, minY, maxX, maxY};
}

static GQTBounds boundsBottomLeftChildQuadBounds(GQTBounds parentBounds) {
  GQTPoint midPoint = boundsMidpoint(parentBounds);
  double minX = parentBounds.minX;
  double minY = parentBounds.minY;
  double maxX = midPoint.x;
  double maxY = midPoint.y;
  return (GQTBounds){minX, minY, maxX, maxY};
}

static BOOL boundsIntersectsBounds(GQTBounds bounds1, GQTBounds bounds2) {
  return (!(bounds1.maxY < bounds2.minY || bounds2.maxY < bounds1.minY) &&
          !(bounds1.maxX < bounds2.minX || bounds2.maxX < bounds1.minX));
}

@implementation GQTPointQuadTreeChild {

  /** Top Right child quad. Nil until this node is split. */
  GQTPointQuadTreeChild *topRight_;

  /** Top Left child quad. Nil until this node is split. */
  GQTPointQuadTreeChild *topLeft_;

  /** Bottom Right child quad. Nil until this node is split. */
  GQTPointQuadTreeChild *bottomRight_;

  /** Bottom Left child quad. Nil until this node is split. */
  GQTPointQuadTreeChild *bottomLeft_;

  /**
   * Items in this PointQuadTree node, if this node has yet to be split. If we have items, children
   * will be nil, likewise, if we have children then items_ will be nil.
   */
  NSMutableArray *items_;

}

- (id)init {
  if (self = [super init]) {
    topRight_    = nil;
    topLeft_     = nil;
    bottomRight_ = nil;
    bottomLeft_  = nil;
    items_       = [NSMutableArray array];
  }
  return self;
}


-    (void)add:(id<GQTPointQuadTreeItem>)item
 withOwnBounds:(GQTBounds)bounds
       atDepth:(NSUInteger)depth {
  if (item == nil) {
    // Note, this should not happen, as GQTPointQuadTree's add method also does a nil check.
    [NSException raise:@"Invalid item argument" format:@"item must not be null"];
  }

  if (items_.count >= kMaxElements && depth < kMaxDepth) {
    [self splitWithOwnBounds:bounds atDepth:depth];
  }

  if (topRight_ != nil) {
    GQTPoint itemPoint = item.point;
    GQTPoint midPoint = boundsMidpoint(bounds);

    if (itemPoint.y > midPoint.y) {
      if (itemPoint.x > midPoint.x) {
        [topRight_ add:item withOwnBounds:boundsTopRightChildQuadBounds(bounds) atDepth:depth+1];
      } else {
        [topLeft_ add:item withOwnBounds:boundsTopLeftChildQuadBounds(bounds) atDepth:depth+1];
      }
    } else {
      if (itemPoint.x > midPoint.x) {
        [bottomRight_ add:item withOwnBounds:boundsBottomRightChildQuadBounds(bounds) atDepth:depth+1];
      } else {
        [bottomLeft_ add:item withOwnBounds:boundsBottomLeftChildQuadBounds(bounds) atDepth:depth+1];
      }
    }
  } else {
    [items_ addObject:item];
  }
}

- (void)splitWithOwnBounds:(GQTBounds)ownBounds atDepth:(NSUInteger)depth {
  assert(items_ != nil);

  topRight_    = [[GQTPointQuadTreeChild alloc] init];
  topLeft_     = [[GQTPointQuadTreeChild alloc] init];
  bottomRight_ = [[GQTPointQuadTreeChild alloc] init];
  bottomLeft_  = [[GQTPointQuadTreeChild alloc] init];

  NSArray *items = items_;
  items_ = nil;

  for (id<GQTPointQuadTreeItem> item in items) {
    [self add:item withOwnBounds:ownBounds atDepth:depth];
  }
}

- (BOOL)remove:(id<GQTPointQuadTreeItem>)item withOwnBounds:(GQTBounds)bounds {
  if (topRight_ != nil) {
    GQTPoint itemPoint = item.point;
    GQTPoint midPoint = boundsMidpoint(bounds);

    if (itemPoint.y > midPoint.y) {
      if (itemPoint.x > midPoint.x) {
        return [topRight_ remove:item withOwnBounds:boundsTopRightChildQuadBounds(bounds)];
      } else {
        return [topLeft_ remove:item withOwnBounds:boundsTopLeftChildQuadBounds(bounds)];
      }
    } else {
      if (itemPoint.x > midPoint.x) {
        return [bottomRight_ remove:item withOwnBounds:boundsBottomRightChildQuadBounds(bounds)];
      } else {
        return [bottomLeft_ remove:item withOwnBounds:boundsBottomLeftChildQuadBounds(bounds)];
      }
    }
  }

  NSUInteger index = [items_ indexOfObject:item];
  if (index != NSNotFound) {
    [items_ removeObjectAtIndex:index];
    return YES;
  } else {
    return NO;
  }
}

- (void)searchWithBounds:(GQTBounds)searchBounds
           withOwnBounds:(GQTBounds)ownBounds
                 results:(NSMutableArray *)accumulator {

  if (topRight_ != nil) {
    GQTBounds topRightBounds    = boundsTopRightChildQuadBounds(ownBounds);
    GQTBounds topLeftBounds     = boundsTopLeftChildQuadBounds(ownBounds);
    GQTBounds bottomRightBounds = boundsBottomRightChildQuadBounds(ownBounds);
    GQTBounds bottomLeftBounds  = boundsBottomLeftChildQuadBounds(ownBounds);

    if (boundsIntersectsBounds(topRightBounds, searchBounds)) {
      [topRight_ searchWithBounds:searchBounds
                    withOwnBounds:topRightBounds
                          results:accumulator];
    }
    if (boundsIntersectsBounds(topLeftBounds, searchBounds)) {
      [topLeft_ searchWithBounds:searchBounds
                   withOwnBounds:topLeftBounds
                         results:accumulator];
    }
    if (boundsIntersectsBounds(bottomRightBounds, searchBounds)) {
      [bottomRight_ searchWithBounds:searchBounds
                       withOwnBounds:bottomRightBounds
                             results:accumulator];
    }
    if (boundsIntersectsBounds(bottomLeftBounds, searchBounds)) {
      [bottomLeft_ searchWithBounds:searchBounds
                      withOwnBounds:bottomLeftBounds
                            results:accumulator];
    }
  } else {
    for (id<GQTPointQuadTreeItem> item in items_) {
      GQTPoint point = item.point;
      if (point.x <= searchBounds.maxX &&
          point.x >= searchBounds.minX &&
          point.y <= searchBounds.maxY &&
          point.y >= searchBounds.minY) {
        [accumulator addObject:item];
      }
    }
  }
}

@end

