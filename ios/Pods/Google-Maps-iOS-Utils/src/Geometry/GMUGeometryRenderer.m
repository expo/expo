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

#import "GMUGeometryRenderer.h"

#import "GMUFeature.h"
#import "GMUGeometryCollection.h"
#import "GMUGroundOverlay.h"
#import "GMULineString.h"
#import "GMUPlacemark.h"
#import "GMUPoint.h"
#import "GMUPolygon.h"
#import "GMUStyle.h"

@implementation GMUGeometryRenderer {
  NSMutableArray<GMSOverlay *> *_mapOverlays;

  /**
   * The Google Map to render the placemarks onto.
   */
  __weak GMSMapView *_map;

  /**
   * The list of parsed geometries to render onto the map.
   */
  NSArray<id<GMUGeometryContainer>> *_geometryContainers;

  /**
   * The list of parsed styles to be applied to the placemarks.
   */
  NSDictionary<NSString *, GMUStyle *> *_styles;

  /**
   * The dispatch queue used to download images for ground overlays and point icons.
   */
  dispatch_queue_t _queue;

  /**
   * Whether the map has been marked as cleared.
   */
  BOOL _isMapCleared;
}

- (instancetype)initWithMap:(GMSMapView *)map
                 geometries:(NSArray<id<GMUGeometryContainer>> *)geometries {
  return [self initWithMap:map geometries:geometries styles:nil];
}

- (instancetype)initWithMap:(GMSMapView *)map
                 geometries:(NSArray<id<GMUGeometryContainer>> *)geometries
                     styles:(NSArray<GMUStyle *> *)styles {
  if (self = [super init]) {
    _map = map;
    _geometryContainers = geometries;
    _styles = [[self class] stylesDictionaryFromArray:styles];
    _mapOverlays = [[NSMutableArray alloc] init];
    _queue = dispatch_queue_create("com.google.gmsutils", DISPATCH_QUEUE_CONCURRENT);
  }
  return self;
}

- (void)render {
  _isMapCleared = NO;
  [self renderGeometryContainers:_geometryContainers];
}

- (void)clear {
  _isMapCleared = YES;
  for (GMSOverlay *overlay in _mapOverlays) {
    overlay.map = nil;
  }
  [_mapOverlays removeAllObjects];
}

- (NSArray<GMSOverlay *> *)mapOverlays {
  return _mapOverlays;
}

+ (NSDictionary<NSString *, GMUStyle *> *)stylesDictionaryFromArray:(NSArray<GMUStyle *> *)styles {
  NSMutableDictionary *dict = [[NSMutableDictionary alloc] initWithCapacity:styles.count];
  for (GMUStyle *style in styles) {
    [dict setObject:style forKey:style.styleID];
  }
  return dict;
}

+ (UIImage *)imageFromPath:(NSString *)path {
  // URLWithString returns nil for a path formatted as a local file reference.
  NSURL *url = [NSURL URLWithString:path];

  NSData *data;
  if (url) {
    // Get the image data from an external file.
    data = [NSData dataWithContentsOfURL:url];
  } else {
    // Get the image data from a local file.
    data = [NSData dataWithContentsOfFile:path];
  }
  return [UIImage imageWithData:data];
}

- (void)renderGeometryContainers:(NSArray<id<GMUGeometryContainer>> *)containers {
  for (id<GMUGeometryContainer> container in containers) {
    GMUStyle *style = container.style;
    if (!style && [container isKindOfClass:[GMUPlacemark class]]) {
      GMUPlacemark *placemark = container;
      style = [_styles objectForKey:placemark.styleUrl];
    }
    [self renderGeometryContainer:container style:style];
  }
}

- (void)renderGeometryContainer:(id<GMUGeometryContainer>)container
                          style:(GMUStyle *)style {
  id<GMUGeometry> geometry = container.geometry;
  if ([geometry isKindOfClass:[GMUGeometryCollection class]]) {
    [self renderMultiGeometry:geometry container:container style:style];
  } else {
    [self renderGeometry:geometry container:container style:style];
  }
}

- (void)renderGeometry:(id<GMUGeometry>)geometry
             container:(id<GMUGeometryContainer>)container
                 style:(GMUStyle *)style {
  if ([geometry isKindOfClass:[GMUPoint class]]) {
    [self renderPoint:geometry container:container style:style];
  } else if ([geometry isKindOfClass:[GMULineString class]]) {
    [self renderLineString:geometry container:container style:style];
  } else if ([geometry isKindOfClass:[GMUPolygon class]]) {
    [self renderPolygon:geometry container:container style:style];
  } else if ([geometry isKindOfClass:[GMUGroundOverlay class]]) {
    [self renderGroundOverlay:geometry placemark:container style:style];
  }
}

- (void)renderPoint:(GMUPoint *)point
          container:(id<GMUGeometryContainer>)container
              style:(GMUStyle *)style {
  CLLocationCoordinate2D coordinate = point.coordinate;
  GMSMarker *marker = [GMSMarker markerWithPosition:coordinate];
  if ([container isKindOfClass:[GMUPlacemark class]]) {
    GMUPlacemark *placemark = container;
    marker.title = style.title ?: placemark.title;
    marker.snippet = placemark.snippet;
  } else {
    marker.title = style.title;
  }
  if (style.anchor.x && style.anchor.y) {
    marker.groundAnchor = style.anchor;
  }
  if (style.heading) {
    marker.rotation = style.heading;
  }
  if (style.iconUrl) {
    __weak GMSMarker *weakMarker = marker;
    __weak GMSMapView *weakMap = _map;
    dispatch_async(_queue, ^{
      UIImage *image = [[self class] imageFromPath:style.iconUrl];
      image = [UIImage imageWithCGImage:image.CGImage
                                  scale:(image.scale * style.scale)
                            orientation:image.imageOrientation];
      dispatch_async(dispatch_get_main_queue(), ^{
        GMSMarker *strongMarker = weakMarker;
        GMSMapView *strongMap = weakMap;
        strongMarker.icon = image;
        if (!_isMapCleared) {
          strongMarker.map = strongMap;
        }
      });
    });
  } else {
    marker.map = _map;
  }
  [_mapOverlays addObject:marker];
}

- (void)renderLineString:(GMULineString *)lineString
               container:(id<GMUGeometryContainer>)container
                   style:(GMUStyle *)style {
  GMSPolyline *line = [GMSPolyline polylineWithPath:lineString.path];
  if (style.width) {
    line.strokeWidth = style.width;
  }
  if (style.strokeColor) {
    line.strokeColor = style.strokeColor;
  }
  if ([container isKindOfClass:[GMUPlacemark class]]) {
    GMUPlacemark *placemark = container;
    line.title = placemark.title;
  }
  line.map = _map;
  [_mapOverlays addObject:line];
}

- (void)renderPolygon:(GMUPolygon *)polygon
            container:(id<GMUGeometryContainer>)container
                style:(GMUStyle *)style {
  GMSPath *outerBoundaries = polygon.paths.firstObject;
  NSArray *innerBoundaries = [[NSArray alloc] init];
  if (polygon.paths.count > 1) {
    innerBoundaries =
        [polygon.paths subarrayWithRange:NSMakeRange(1, polygon.paths.count - 1)];
  }
  NSMutableArray<GMSPath *> *holes = [[NSMutableArray alloc] init];
  for (GMSPath *hole in innerBoundaries) {
    [holes addObject:hole];
  }
  GMSPolygon *poly = [GMSPolygon polygonWithPath:outerBoundaries];
  if (style.hasFill && style.fillColor) {
    poly.fillColor = style.fillColor;
  }
  if (style.hasStroke) {
    if (style.strokeColor) {
      poly.strokeColor = style.strokeColor;
    }
    if (style.width) {
      poly.strokeWidth = style.width;
    }
  }
  if (holes.count) {
    poly.holes = holes;
  }
  if ([container isKindOfClass:[GMUPlacemark class]]) {
    GMUPlacemark *placemark = container;
    poly.title = placemark.title;
  }
  poly.map = _map;
  [_mapOverlays addObject:poly];
}

- (void)renderGroundOverlay:(GMUGroundOverlay *)overlay
                  placemark:(GMUPlacemark *)placemark
                      style:(GMUStyle *)style {
  CLLocationCoordinate2D northEast = overlay.northEast;
  CLLocationCoordinate2D southWest = overlay.southWest;
  CLLocationDegrees centerLatitude = (northEast.latitude + southWest.latitude) / 2.0;
  CLLocationDegrees centerLongitude = (northEast.longitude + southWest.longitude) / 2.0;
  if (northEast.longitude < southWest.longitude) {
    if (centerLongitude >= 0) {
      centerLongitude -= 180;
    } else {
      centerLongitude += 180;
    }
  }
  CLLocationCoordinate2D center = CLLocationCoordinate2DMake(centerLatitude, centerLongitude);
  GMSCoordinateBounds *northEastBounds = [[GMSCoordinateBounds alloc] initWithCoordinate:northEast
                                                                              coordinate:center];
  GMSCoordinateBounds *southWestBounds = [[GMSCoordinateBounds alloc] initWithCoordinate:southWest
                                                                              coordinate:center];
  GMSCoordinateBounds *bounds = [northEastBounds includingBounds:southWestBounds];
  GMSGroundOverlay *groundOverlay = [GMSGroundOverlay groundOverlayWithBounds:bounds icon:nil];
  groundOverlay.zIndex = overlay.zIndex;
  groundOverlay.bearing = overlay.rotation;
  __weak GMSGroundOverlay *weakGroundOverlay = groundOverlay;
  __weak GMSMapView *weakMap = _map;
  dispatch_async(_queue, ^{
    UIImage *image = [[self class] imageFromPath:overlay.href];
    dispatch_async(dispatch_get_main_queue(), ^{
      GMSGroundOverlay *strongGroundOverlay = weakGroundOverlay;
      GMSMapView *strongMap = weakMap;
      strongGroundOverlay.icon = image;
      if (!_isMapCleared) {
        strongGroundOverlay.map = strongMap;
      }
    });
  });
  [_mapOverlays addObject:groundOverlay];
}

- (void)renderMultiGeometry:(id<GMUGeometry>)geometry
                  container:(id<GMUGeometryContainer>)container
                      style:(GMUStyle *)style {
  GMUGeometryCollection *multiGeometry = geometry;
  for (id<GMUGeometry> singleGeometry in multiGeometry.geometries) {
    [self renderGeometry:singleGeometry container:container style:style];
  }
}

@end
