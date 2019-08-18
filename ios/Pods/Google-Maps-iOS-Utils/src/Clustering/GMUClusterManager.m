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

#import "GMUClusterManager+Testing.h"

#import "GMUSimpleClusterAlgorithm.h"
#import "GMUClusterRenderer.h"

static NSString *const kGMUCameraKeyPath = @"camera";

// How long to wait for a cluster request before actually performing the clustering operation
// to avoid continuous clustering when the camera is moving which can affect performance.
static const double kGMUClusterWaitIntervalSeconds = 0.2;

@implementation GMUClusterManager {
  // The map view that this object is associated with.
  __weak GMSMapView *_mapView;

  // Position of the camera on the previous cluster invocation.
  GMSCameraPosition *_previousCamera;

  // Tracks number of cluster requests so that we can safely ignore stale (redundant) ones.
  NSUInteger _clusterRequestCount;

  // Renderer.
  id<GMUClusterRenderer> _renderer;
}

- (instancetype)initWithMap:(GMSMapView *)mapView
                  algorithm:(id<GMUClusterAlgorithm>)algorithm
                   renderer:(id<GMUClusterRenderer>)renderer {

  if ((self = [super init])) {
    _algorithm = [[GMUSimpleClusterAlgorithm alloc] init];
    _mapView = mapView;
    _previousCamera = _mapView.camera;
    _algorithm = algorithm;
    _renderer = renderer;

    [_mapView addObserver:self
               forKeyPath:kGMUCameraKeyPath
                  options:NSKeyValueObservingOptionNew
                  context:nil];
  }

  return self;
}

- (void)dealloc {
  [_mapView removeObserver:self forKeyPath:kGMUCameraKeyPath];
}

- (void)setDelegate:(id<GMUClusterManagerDelegate>)delegate
        mapDelegate:(id<GMSMapViewDelegate> _Nullable)mapDelegate {
  _delegate = delegate;
  _mapView.delegate = self;
  _mapDelegate = mapDelegate;
}

- (void)addItem:(id<GMUClusterItem>)item {
  [_algorithm addItems:[[NSMutableArray alloc] initWithObjects:item, nil]];
}

- (void)addItems:(NSArray<id<GMUClusterItem>> *)items {
  [_algorithm addItems:items];
}

- (void)removeItem:(id<GMUClusterItem>)item {
  [_algorithm removeItem:item];
}

- (void)clearItems {
  [_algorithm clearItems];
  [self requestCluster];
}

- (void)cluster {
  NSUInteger integralZoom = (NSUInteger)floorf(_mapView.camera.zoom + 0.5f);
  NSArray<id<GMUCluster>> *clusters = [_algorithm clustersAtZoom:integralZoom];
  [_renderer renderClusters:clusters];
  _previousCamera = _mapView.camera;
}

#pragma mark GMSMapViewDelegate

- (BOOL)mapView:(GMSMapView *)mapView didTapMarker:(GMSMarker *)marker {
  if ([_delegate respondsToSelector:@selector(clusterManager:didTapCluster:)] &&
      [marker.userData conformsToProtocol:@protocol(GMUCluster)]) {
    id<GMUCluster> cluster = marker.userData;
    if ([_delegate clusterManager:self didTapCluster:cluster]) {
      return YES;
    }
  }

  if ([_delegate respondsToSelector:@selector(clusterManager:didTapClusterItem:)] &&
      [marker.userData conformsToProtocol:@protocol(GMUClusterItem)]) {
    id<GMUClusterItem> clusterItem = marker.userData;
    if ([_delegate clusterManager:self didTapClusterItem:clusterItem]) {
      return YES;
    }
  }

  // Forward to _mapDelegate as a fallback.
  if ([_mapDelegate respondsToSelector:@selector(mapView:didTapMarker:)]) {
    return [_mapDelegate mapView:mapView didTapMarker:marker];
  }

  return NO;
}

#pragma mark Delegate Forwards

- (void)mapView:(GMSMapView *)mapView willMove:(BOOL)gesture {
  if ([_mapDelegate respondsToSelector:@selector(mapView:willMove:)]) {
    [_mapDelegate mapView:mapView willMove:gesture];
  }
}

- (void)mapView:(GMSMapView *)mapView didChangeCameraPosition:(GMSCameraPosition *)position {
  if ([_mapDelegate respondsToSelector:@selector(mapView:didChangeCameraPosition:)]) {
    [_mapDelegate mapView:mapView didChangeCameraPosition:position];
  }
}

- (void)mapView:(GMSMapView *)mapView idleAtCameraPosition:(GMSCameraPosition *)position {
  if ([_mapDelegate respondsToSelector:@selector(mapView:idleAtCameraPosition:)]) {
    [_mapDelegate mapView:mapView idleAtCameraPosition:position];
  }
}

- (void)mapView:(GMSMapView *)mapView didTapAtCoordinate:(CLLocationCoordinate2D)coordinate {
  if ([_mapDelegate respondsToSelector:@selector(mapView:didTapAtCoordinate:)]) {
    [_mapDelegate mapView:mapView didTapAtCoordinate:coordinate];
  }
}

- (void)mapView:(GMSMapView *)mapView didLongPressAtCoordinate:(CLLocationCoordinate2D)coordinate {
  if ([_mapDelegate respondsToSelector:@selector(mapView:didLongPressAtCoordinate:)]) {
    [_mapDelegate mapView:mapView didLongPressAtCoordinate:coordinate];
  }
}

- (void)mapView:(GMSMapView *)mapView didTapInfoWindowOfMarker:(GMSMarker *)marker {
  if ([_mapDelegate respondsToSelector:@selector(mapView:didTapInfoWindowOfMarker:)]) {
    [_mapDelegate mapView:mapView didTapInfoWindowOfMarker:marker];
  }
}

- (void)mapView:(GMSMapView *)mapView didLongPressInfoWindowOfMarker:(GMSMarker *)marker {
  if ([_mapDelegate respondsToSelector:@selector(mapView:didLongPressInfoWindowOfMarker:)]) {
    [_mapDelegate mapView:mapView didLongPressInfoWindowOfMarker:marker];
  }
}

- (void)mapView:(GMSMapView *)mapView didTapOverlay:(GMSOverlay *)overlay {
  if ([_mapDelegate respondsToSelector:@selector(mapView:didTapOverlay:)]) {
    [_mapDelegate mapView:mapView didTapOverlay:overlay];
  }
}

- (UIView *)mapView:(GMSMapView *)mapView markerInfoWindow:(GMSMarker *)marker {
  if ([_mapDelegate respondsToSelector:@selector(mapView:markerInfoWindow:)]) {
    return [_mapDelegate mapView:mapView markerInfoWindow:marker];
  }
  return nil;
}

- (void)mapView:(GMSMapView *)mapView didTapPOIWithPlaceID:(NSString *)placeID name:(NSString *)name location:(CLLocationCoordinate2D)location {
    if ([_mapDelegate respondsToSelector:@selector(mapView:didTapPOIWithPlaceID:name:location:)]) {
        [_mapDelegate mapView:mapView didTapPOIWithPlaceID:placeID name:name location:location];
    }
}

- (UIView *)mapView:(GMSMapView *)mapView markerInfoContents:(GMSMarker *)marker {
  if ([_mapDelegate respondsToSelector:@selector(mapView:markerInfoContents:)]) {
    return [_mapDelegate mapView:mapView markerInfoContents:marker];
  }
  return nil;
}

- (void)mapView:(GMSMapView *)mapView didCloseInfoWindowOfMarker:(GMSMarker *)marker {
  if ([_mapDelegate respondsToSelector:@selector(mapView:didCloseInfoWindowOfMarker:)]) {
    [_mapDelegate mapView:mapView didCloseInfoWindowOfMarker:marker];
  }
}

- (void)mapView:(GMSMapView *)mapView didBeginDraggingMarker:(GMSMarker *)marker {
  if ([_mapDelegate respondsToSelector:@selector(mapView:didBeginDraggingMarker:)]) {
    [_mapDelegate mapView:mapView didBeginDraggingMarker:marker];
  }
}

- (void)mapView:(GMSMapView *)mapView didEndDraggingMarker:(GMSMarker *)marker {
  if ([_mapDelegate respondsToSelector:@selector(mapView:didEndDraggingMarker:)]) {
    [_mapDelegate mapView:mapView didEndDraggingMarker:marker];
  }
}

- (void)mapView:(GMSMapView *)mapView didDragMarker:(GMSMarker *)marker {
  if ([_mapDelegate respondsToSelector:@selector(mapView:didDragMarker:)]) {
    [_mapDelegate mapView:mapView didDragMarker:marker];
  }
}

- (BOOL)didTapMyLocationButtonForMapView:(GMSMapView *)mapView {
  if ([_mapDelegate respondsToSelector:@selector(didTapMyLocationButtonForMapView:)]) {
    return [_mapDelegate didTapMyLocationButtonForMapView:mapView];
  }
  return NO;
}

- (void)mapViewDidStartTileRendering:(GMSMapView *)mapView {
  if ([_mapDelegate respondsToSelector:@selector(mapViewDidStartTileRendering:)]) {
    [_mapDelegate mapViewDidStartTileRendering:mapView];
  }
}

- (void)mapViewDidFinishTileRendering:(GMSMapView *)mapView {
  if ([_mapDelegate respondsToSelector:@selector(mapViewDidFinishTileRendering:)]) {
    [_mapDelegate mapViewDidFinishTileRendering:mapView];
  }
}

#pragma mark Testing

- (NSUInteger)clusterRequestCount {
  return _clusterRequestCount;
}

#pragma mark Private

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSString *, id> *)change
                       context:(void *)context {
  GMSCameraPosition *camera = _mapView.camera;
  NSUInteger previousIntegralZoom = (NSUInteger)floorf(_previousCamera.zoom + 0.5f);
  NSUInteger currentIntegralZoom = (NSUInteger)floorf(camera.zoom + 0.5f);
  if (previousIntegralZoom != currentIntegralZoom) {
    [self requestCluster];
  } else {
    [_renderer update];
  }
}

- (void)requestCluster {
  __weak GMUClusterManager *weakSelf = self;
  ++_clusterRequestCount;
  NSUInteger requestNumber = _clusterRequestCount;
  dispatch_after(
      dispatch_time(DISPATCH_TIME_NOW, (int64_t)(kGMUClusterWaitIntervalSeconds * NSEC_PER_SEC)),
      dispatch_get_main_queue(), ^{
        GMUClusterManager *strongSelf = weakSelf;
        if (strongSelf == nil) {
          return;
        }

        // Ignore if there are newer requests.
        if (requestNumber != strongSelf->_clusterRequestCount) {
          return;
        }
        [strongSelf cluster];
      });
}

@end

