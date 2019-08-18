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
#import "GQTPointQuadTreeItem.h"
#import "GQTBounds.h"

/**
 * This is an internal class, use |GQTPointQuadTree| instead.
 * Please note, this class is not thread safe.
 *
 * This class represents an internal node of a |GQTPointQuadTree|.
 */

@interface GQTPointQuadTreeChild : NSObject

/**
 * Insert an item into this PointQuadTreeChild
 *
 * @param item The item to insert. Must not be nil.
 * @param bounds The bounds of this node.
 * @param depth The depth of this node.
 */
-    (void)add:(id<GQTPointQuadTreeItem>)item
 withOwnBounds:(GQTBounds)bounds
       atDepth:(NSUInteger)depth;

/**
 * Delete an item from this PointQuadTree.
 *
 * @param item The item to delete.
 * @param bounds The bounds of this node.
 * @return |NO| if the items was not found in the tree, |YES| otherwise.
 */
- (BOOL)remove:(id<GQTPointQuadTreeItem>)item withOwnBounds:(GQTBounds)bounds;

/**
 * Retreive all items in this PointQuadTree within a bounding box.
 *
 * @param searchBounds The bounds of the search box.
 * @param ownBounds    The bounds of this node.
 * @param accumulator  The results of the search.
 */
- (void)searchWithBounds:(GQTBounds)searchBounds
           withOwnBounds:(GQTBounds)ownBounds
                 results:(NSMutableArray *)accumulator;

/**
 * Split the contents of this Quad over four child quads.
 * @param ownBounds The bounds of this node.
 * @param depth     The depth of this node.
 */
- (void)splitWithOwnBounds:(GQTBounds)ownBounds atDepth:(NSUInteger)depth;

@end

