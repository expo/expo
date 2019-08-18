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

#import "GMUClusterRenderer.h"

NS_ASSUME_NONNULL_BEGIN

@class GMSMapView;
@class GMSMarker;

@protocol GMUCluster;
@protocol GMUClusterIconGenerator;
@protocol GMUClusterRenderer;

/**
 * Delegate for id<GMUClusterRenderer> to provide extra functionality to the default
 * renderer.
 */
@protocol GMUClusterRendererDelegate<NSObject>

@optional

/**
 * Returns a marker for an |object|. The |object| can be either an id<GMUCluster>
 * or an id<GMUClusterItem>. Use this delegate to control of the life cycle of
 * the marker. Any properties set on the returned marker will be honoured except
 * for: .position, .icon, .groundAnchor, .zIndex and .userData. To customize
 * these properties use renderer:willRenderMarker.
 * Note that changing a marker's position is not recommended because it will
 * interfere with the marker animation.
 */
- (nullable GMSMarker *)renderer:(id<GMUClusterRenderer>)renderer markerForObject:(id)object;

/**
 * Raised when a marker (for a cluster or an item) is about to be added to the map.
 * Use the marker.userData property to check whether it is a cluster marker or an
 * item marker.
 */
- (void)renderer:(id<GMUClusterRenderer>)renderer willRenderMarker:(GMSMarker *)marker;

/**
 * Raised when a marker (for a cluster or an item) has just been added to the map
 * and animation has been added.
 * Use the marker.userData property to check whether it is a cluster marker or an
 * item marker.
 */
- (void)renderer:(id<GMUClusterRenderer>)renderer didRenderMarker:(GMSMarker *)marker;

@end

/**
 * Default cluster renderer which shows clusters as markers with specialized icons.
 * There is logic to decide whether to expand a cluster or not depending on the number of
 * items or the zoom level.
 * There is also some performance optimization where only clusters within the visisble
 * region are shown.
 */
@interface GMUDefaultClusterRenderer : NSObject<GMUClusterRenderer>

/**
 * Animates the clusters to achieve splitting (when zooming in) and merging
 * (when zooming out) effects:
 * - splitting large clusters into smaller ones when zooming in.
 * - merging small clusters into bigger ones when zooming out.
 *
 * NOTES: the position to animate to/from for each cluster is heuristically
 * calculated by finding the first overlapping cluster. This means that:
 * - when zooming in:
 *    if a cluster on a higher zoom level is made from multiple clusters on
 *    a lower zoom level the split will only animate the new cluster from
 *    one of them.
 * - when zooming out:
 *    if a cluster on a higher zoom level is split into multiple parts to join
 *    multiple clusters at a lower zoom level, the merge will only animate
 *    the old cluster into one of them.
 * Because of these limitations, the actual cluster sizes may not add up, for
 * example people may see 3 clusters of size 3, 4, 5 joining to make up a cluster
 * of only 8 for non-hierachical clusters. And vice versa, a cluster of 8 may
 * split into 3 clusters of size 3, 4, 5. For hierarchical clusters, the numbers
 * should add up however.
 *
 * Default to YES.
 */
@property(nonatomic) BOOL animatesClusters;

/**
 * Allows setting a zIndex value for the clusters.  This becomes useful
 * when using multiple cluster data sets on the map and require a predictable
 * way of displaying multiple sets with a predictable layering order.
 *
 * If no specific zIndex is not specified during the initialization, the
 * default zIndex is '1'.  Larger zIndex values are drawn over lower ones
 * similar to the zIndex value of GMSMarkers.
 */
@property(nonatomic) int zIndex;

/** Sets to further customize the renderer. */
@property(nonatomic, nullable, weak) id<GMUClusterRendererDelegate> delegate;

- (instancetype)initWithMapView:(GMSMapView *)mapView
           clusterIconGenerator:(id<GMUClusterIconGenerator>)iconGenerator;

/**
 * If returns NO, cluster items will be expanded and rendered as normal markers.
 * Subclass can override this method to provide custom logic.
 */
- (BOOL)shouldRenderAsCluster:(id<GMUCluster>)cluster atZoom:(float)zoom;

@end

NS_ASSUME_NONNULL_END
