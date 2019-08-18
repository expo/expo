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

#import "GMUDefaultClusterRenderer+Testing.h"

#import <GoogleMaps/GoogleMaps.h>

#import "GMUClusterIconGenerator.h"
#import "GMUWrappingDictionaryKey.h"

// Clusters smaller than this threshold will be expanded.
static const NSUInteger kGMUMinClusterSize = 4;

// At zooms above this level, clusters will be expanded.
// This is to prevent cases where items are so close to each other than they are always grouped.
static const float kGMUMaxClusterZoom = 20;

// Animation duration for marker splitting/merging effects.
static const double kGMUAnimationDuration = 0.5;  // seconds.

@implementation GMUDefaultClusterRenderer {
  // Map view to render clusters on.
  __weak GMSMapView *_mapView;

  // Collection of markers added to the map.
  NSMutableArray<GMSMarker *> *_markers;

  // Icon generator used to create cluster icon.
  id<GMUClusterIconGenerator> _clusterIconGenerator;

  // Current clusters being rendered.
  NSArray<id<GMUCluster>> *_clusters;

  // Tracks clusters that have been rendered to the map.
  NSMutableSet *_renderedClusters;

  // Tracks cluster items that have been rendered to the map.
  NSMutableSet *_renderedClusterItems;

  // Stores previous zoom level to determine zooming direction (in/out).
  float _previousZoom;

  // Lookup map from cluster item to an old cluster.
  NSMutableDictionary<GMUWrappingDictionaryKey *, id<GMUCluster>> *_itemToOldClusterMap;

  // Lookup map from cluster item to a new cluster.
  NSMutableDictionary<GMUWrappingDictionaryKey *, id<GMUCluster>> *_itemToNewClusterMap;
}

- (instancetype)initWithMapView:(GMSMapView *)mapView
           clusterIconGenerator:(id<GMUClusterIconGenerator>)iconGenerator {
  if ((self = [super init])) {
    _mapView = mapView;
    _markers = [[NSMutableArray<GMSMarker *> alloc] init];
    _clusterIconGenerator = iconGenerator;
    _renderedClusters = [[NSMutableSet alloc] init];
    _renderedClusterItems = [[NSMutableSet alloc] init];
    _animatesClusters = YES;
    _zIndex = 1;
  }
  return self;
}

- (void)dealloc {
  [self clear];
}

- (BOOL)shouldRenderAsCluster:(id<GMUCluster>)cluster atZoom:(float)zoom {
  return cluster.count >= kGMUMinClusterSize && zoom <= kGMUMaxClusterZoom;
}

#pragma mark GMUClusterRenderer

- (void)renderClusters:(NSArray<id<GMUCluster>> *)clusters {
  [_renderedClusters removeAllObjects];
  [_renderedClusterItems removeAllObjects];

  if (_animatesClusters) {
    [self renderAnimatedClusters:clusters];
  } else {
    // No animation, just remove existing markers and add new ones.
    _clusters = [clusters copy];
    [self clearMarkers:_markers];
    _markers = [[NSMutableArray<GMSMarker *> alloc] init];
    [self addOrUpdateClusters:clusters animated:NO];
  }
}

- (void)renderAnimatedClusters:(NSArray<id<GMUCluster>> *)clusters {
  float zoom = _mapView.camera.zoom;
  BOOL isZoomingIn = zoom > _previousZoom;
  _previousZoom = zoom;

  [self prepareClustersForAnimation:clusters isZoomingIn:isZoomingIn];

  _clusters = [clusters copy];

  NSArray *existingMarkers = _markers;
  _markers = [[NSMutableArray<GMSMarker *> alloc] init];

  [self addOrUpdateClusters:clusters animated:isZoomingIn];

  if (isZoomingIn) {
    [self clearMarkers:existingMarkers];
  } else {
    [self clearMarkersAnimated:existingMarkers];
  }
}

- (void)clearMarkersAnimated:(NSArray<GMSMarker *> *)markers {
  // Remove existing markers: animate to nearest new cluster.
  GMSCoordinateBounds *visibleBounds =
      [[GMSCoordinateBounds alloc] initWithRegion:[_mapView.projection visibleRegion]];

  for (GMSMarker *marker in markers) {
    // If the marker for the attached userData has just been added, do not perform animation.
    if ([_renderedClusterItems containsObject:marker.userData]) {
      marker.map = nil;
      continue;
    }
    // If the marker is outside the visible view port, do not perform animation.
    if (![visibleBounds containsCoordinate:marker.position]) {
      marker.map = nil;
      continue;
    }

    // Find a candidate cluster to animate to.
    id<GMUCluster> toCluster = nil;
    if ([marker.userData conformsToProtocol:@protocol(GMUCluster)]) {
      id<GMUCluster> cluster = marker.userData;
      toCluster = [self overlappingClusterForCluster:cluster itemMap:_itemToNewClusterMap];
    } else {
      GMUWrappingDictionaryKey *key =
          [[GMUWrappingDictionaryKey alloc] initWithObject:marker.userData];
      toCluster = [_itemToNewClusterMap objectForKey:key];
    }
    // If there is not near by cluster to animate to, do not perform animation.
    if (toCluster == nil) {
      marker.map = nil;
      continue;
    }

    // All is good, perform the animation.
    [CATransaction begin];
    [CATransaction setAnimationDuration:kGMUAnimationDuration];
    CLLocationCoordinate2D toPosition = toCluster.position;
    marker.layer.latitude = toPosition.latitude;
    marker.layer.longitude = toPosition.longitude;
    [CATransaction commit];
  }

  // Clears existing markers after animation has presumably ended.
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, kGMUAnimationDuration * NSEC_PER_SEC),
                 dispatch_get_main_queue(), ^{
                   [self clearMarkers:markers];
                 });
}

// Called when camera is changed to reevaluate if new clusters need to be displayed because
// they become visible.
- (void)update {
  [self addOrUpdateClusters:_clusters animated:NO];
}

#pragma mark Testing

- (NSArray<GMSMarker *> *)markers {
  return _markers;
}

#pragma mark Private

// Builds lookup map for item to old clusters, new clusters.
- (void)prepareClustersForAnimation:(NSArray<id<GMUCluster>> *)newClusters
                        isZoomingIn:(BOOL)isZoomingIn {
  float zoom = _mapView.camera.zoom;

  if (isZoomingIn) {
    _itemToOldClusterMap =
        [[NSMutableDictionary<GMUWrappingDictionaryKey *, id<GMUCluster>> alloc] init];
    for (id<GMUCluster> cluster in _clusters) {
      if (![self shouldRenderAsCluster:cluster atZoom:zoom]) continue;
      for (id<GMUClusterItem> clusterItem in cluster.items) {
        GMUWrappingDictionaryKey *key =
            [[GMUWrappingDictionaryKey alloc] initWithObject:clusterItem];
        [_itemToOldClusterMap setObject:cluster forKey:key];
      }
    }
    _itemToNewClusterMap = nil;
  } else {
    _itemToOldClusterMap = nil;
    _itemToNewClusterMap =
        [[NSMutableDictionary<GMUWrappingDictionaryKey *, id<GMUCluster>> alloc] init];
    for (id<GMUCluster> cluster in newClusters) {
      if (![self shouldRenderAsCluster:cluster atZoom:zoom]) continue;
      for (id<GMUClusterItem> clusterItem in cluster.items) {
        GMUWrappingDictionaryKey *key =
            [[GMUWrappingDictionaryKey alloc] initWithObject:clusterItem];
        [_itemToNewClusterMap setObject:cluster forKey:key];
      }
    }
  }
}

// Goes through each cluster |clusters| and add a marker for it if it is:
// - inside the visible region of the camera.
// - not yet already added.
- (void)addOrUpdateClusters:(NSArray<id<GMUCluster>> *)clusters animated:(BOOL)animated {
  GMSCoordinateBounds *visibleBounds =
      [[GMSCoordinateBounds alloc] initWithRegion:[_mapView.projection visibleRegion]];

  for (id<GMUCluster> cluster in clusters) {
    if ([_renderedClusters containsObject:cluster]) continue;

    BOOL shouldShowCluster = [visibleBounds containsCoordinate:cluster.position];
    if (!shouldShowCluster && animated) {
      for (id<GMUClusterItem> item in cluster.items) {
        GMUWrappingDictionaryKey *key = [[GMUWrappingDictionaryKey alloc] initWithObject:item];
        id<GMUCluster> oldCluster = [_itemToOldClusterMap objectForKey:key];
        if (oldCluster != nil && [visibleBounds containsCoordinate:oldCluster.position]) {
          shouldShowCluster = YES;
          break;
        }
      }
    }
    if (shouldShowCluster) {
      [self renderCluster:cluster animated:animated];
    }
  }
}

- (void)renderCluster:(id<GMUCluster>)cluster animated:(BOOL)animated {
  float zoom = _mapView.camera.zoom;
  if ([self shouldRenderAsCluster:cluster atZoom:zoom]) {
    CLLocationCoordinate2D fromPosition = kCLLocationCoordinate2DInvalid;
    if (animated) {
      id<GMUCluster> fromCluster =
          [self overlappingClusterForCluster:cluster itemMap:_itemToOldClusterMap];
      animated = fromCluster != nil;
      fromPosition = fromCluster.position;
    }

    UIImage *icon = [_clusterIconGenerator iconForSize:cluster.count];
    GMSMarker *marker = [self markerWithPosition:cluster.position
                                            from:fromPosition
                                        userData:cluster
                                     clusterIcon:icon
                                        animated:animated];
    [_markers addObject:marker];
  } else {
    for (id<GMUClusterItem> item in cluster.items) {
      CLLocationCoordinate2D fromPosition = kCLLocationCoordinate2DInvalid;
      BOOL shouldAnimate = animated;
      if (shouldAnimate) {
        GMUWrappingDictionaryKey *key = [[GMUWrappingDictionaryKey alloc] initWithObject:item];
        id<GMUCluster> fromCluster = [_itemToOldClusterMap objectForKey:key];
        shouldAnimate = fromCluster != nil;
        fromPosition = fromCluster.position;
      }

      GMSMarker *marker = [self markerWithPosition:item.position
                                              from:fromPosition
                                          userData:item
                                       clusterIcon:nil
                                          animated:shouldAnimate];
      [_markers addObject:marker];
      [_renderedClusterItems addObject:item];
    }
  }
  [_renderedClusters addObject:cluster];
}

- (GMSMarker *)markerForObject:(id)object {
  GMSMarker *marker;
  if ([_delegate respondsToSelector:@selector(renderer:markerForObject:)]) {
    marker = [_delegate renderer:self markerForObject:object];
  }
  return marker ?: [[GMSMarker alloc] init];
}

// Returns a marker at final position of |position| with attached |userData|.
// If animated is YES, animates from the closest point from |points|.
- (GMSMarker *)markerWithPosition:(CLLocationCoordinate2D)position
                             from:(CLLocationCoordinate2D)from
                         userData:(id)userData
                      clusterIcon:(UIImage *)clusterIcon
                         animated:(BOOL)animated {
  GMSMarker *marker = [self markerForObject:userData];
  CLLocationCoordinate2D initialPosition = animated ? from : position;
  marker.position = initialPosition;
  marker.userData = userData;
  if (clusterIcon != nil) {
    marker.icon = clusterIcon;
    marker.groundAnchor = CGPointMake(0.5, 0.5);
  }
  marker.zIndex = _zIndex;

  if ([_delegate respondsToSelector:@selector(renderer:willRenderMarker:)]) {
    [_delegate renderer:self willRenderMarker:marker];
  }
  marker.map = _mapView;

  if (animated) {
    [CATransaction begin];
    [CATransaction setAnimationDuration:kGMUAnimationDuration];
    marker.layer.latitude = position.latitude;
    marker.layer.longitude = position.longitude;
    [CATransaction commit];
  }

  if ([_delegate respondsToSelector:@selector(renderer:didRenderMarker:)]) {
    [_delegate renderer:self didRenderMarker:marker];
  }
  return marker;
}

// Returns clusters which should be rendered and is inside the camera visible region.
- (NSArray<id<GMUCluster>> *)visibleClustersFromClusters:(NSArray<id<GMUCluster>> *)clusters {
  NSMutableArray *visibleClusters = [[NSMutableArray alloc] init];
  float zoom = _mapView.camera.zoom;
  GMSCoordinateBounds *visibleBounds =
      [[GMSCoordinateBounds alloc] initWithRegion:[_mapView.projection visibleRegion]];
  for (id<GMUCluster> cluster in clusters) {
    if (![visibleBounds containsCoordinate:cluster.position]) continue;
    if (![self shouldRenderAsCluster:cluster atZoom:zoom]) continue;
    [visibleClusters addObject:cluster];
  }
  return visibleClusters;
}

// Returns the first cluster in |itemMap| that shares a common item with the input |cluster|.
// Used for heuristically finding candidate cluster to animate to/from.
- (id<GMUCluster>)overlappingClusterForCluster:
    (id<GMUCluster>)cluster
        itemMap:(NSDictionary<GMUWrappingDictionaryKey *, id<GMUCluster>> *)itemMap {
  id<GMUCluster> found = nil;
  for (id<GMUClusterItem> item in cluster.items) {
    GMUWrappingDictionaryKey *key = [[GMUWrappingDictionaryKey alloc] initWithObject:item];
    id<GMUCluster> candidate = [itemMap objectForKey:key];
    if (candidate != nil) {
      found = candidate;
      break;
    }
  }
  return found;
}

// Removes all existing markers from the attached map.
- (void)clear {
  [self clearMarkers:_markers];
  [_markers removeAllObjects];
  [_renderedClusters removeAllObjects];
  [_renderedClusterItems removeAllObjects];
  [_itemToNewClusterMap removeAllObjects];
  [_itemToOldClusterMap removeAllObjects];
  _clusters = nil;
}

- (void)clearMarkers:(NSArray<GMSMarker *> *)markers {
  for (GMSMarker *marker in markers) {
    marker.userData = nil;
    marker.map = nil;
  }
}

@end
