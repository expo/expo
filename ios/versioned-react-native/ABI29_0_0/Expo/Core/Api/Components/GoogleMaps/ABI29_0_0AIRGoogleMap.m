//
//  ABI29_0_0AIRGoogleMap.m
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#import "ABI29_0_0AIRGoogleMap.h"
#import "ABI29_0_0AIRGoogleMapMarker.h"
#import "ABI29_0_0AIRGoogleMapMarkerManager.h"
#import "ABI29_0_0AIRGoogleMapPolygon.h"
#import "ABI29_0_0AIRGoogleMapPolyline.h"
#import "ABI29_0_0AIRGoogleMapCircle.h"
#import "ABI29_0_0AIRGoogleMapUrlTile.h"
#import "ABI29_0_0AIRGoogleMapOverlay.h"
#import <GoogleMaps/GoogleMaps.h>
#import <Google-Maps-iOS-Utils/GMUKMLParser.h>
#import <Google-Maps-iOS-Utils/GMUPlacemark.h>
#import <Google-Maps-iOS-Utils/GMUPoint.h>
#import <Google-Maps-iOS-Utils/GMUGeometryRenderer.h>
#import <MapKit/MapKit.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>
#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import "ABI29_0_0RCTConvert+AirMap.h"

id regionAsJSON(MKCoordinateRegion region) {
  return @{
           @"latitude": [NSNumber numberWithDouble:region.center.latitude],
           @"longitude": [NSNumber numberWithDouble:region.center.longitude],
           @"latitudeDelta": [NSNumber numberWithDouble:region.span.latitudeDelta],
           @"longitudeDelta": [NSNumber numberWithDouble:region.span.longitudeDelta],
           };
}

@interface ABI29_0_0AIRGoogleMap ()

- (id)eventFromCoordinate:(CLLocationCoordinate2D)coordinate;

@end

@implementation ABI29_0_0AIRGoogleMap
{
  NSMutableArray<UIView *> *_ReactABI29_0_0Subviews;
  MKCoordinateRegion _initialRegion;
  MKCoordinateRegion _region;
  BOOL _initialRegionSetOnLoad;
  BOOL _didCallOnMapReady;
  BOOL _didMoveToWindow;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _ReactABI29_0_0Subviews = [NSMutableArray new];
    _markers = [NSMutableArray array];
    _polygons = [NSMutableArray array];
    _polylines = [NSMutableArray array];
    _circles = [NSMutableArray array];
    _tiles = [NSMutableArray array];
    _overlays = [NSMutableArray array];
    _initialRegion = MKCoordinateRegionMake(CLLocationCoordinate2DMake(0.0, 0.0), MKCoordinateSpanMake(0.0, 0.0));
    _region = MKCoordinateRegionMake(CLLocationCoordinate2DMake(0.0, 0.0), MKCoordinateSpanMake(0.0, 0.0));
    _initialRegionSetOnLoad = false;
    _didCallOnMapReady = false;
    _didMoveToWindow = false;

    // Listen to the myLocation property of GMSMapView.
    [self addObserver:self
           forKeyPath:@"myLocation"
              options:NSKeyValueObservingOptionNew
              context:NULL];
  }
  return self;
}

- (void)dealloc {
  [self removeObserver:self
            forKeyPath:@"myLocation"
               context:NULL];
}

- (id)eventFromCoordinate:(CLLocationCoordinate2D)coordinate {

  CGPoint touchPoint = [self.projection pointForCoordinate:coordinate];

  return @{
           @"coordinate": @{
               @"latitude": @(coordinate.latitude),
               @"longitude": @(coordinate.longitude),
               },
           @"position": @{
               @"x": @(touchPoint.x),
               @"y": @(touchPoint.y),
               },
           };
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-missing-super-calls"
- (void)insertReactABI29_0_0Subview:(id<ABI29_0_0RCTComponent>)subview atIndex:(NSInteger)atIndex {
  // Our desired API is to pass up markers/overlays as children to the mapview component.
  // This is where we intercept them and do the appropriate underlying mapview action.
  if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapMarker class]]) {
    ABI29_0_0AIRGoogleMapMarker *marker = (ABI29_0_0AIRGoogleMapMarker*)subview;
    marker.realMarker.map = self;
    [self.markers addObject:marker];
  } else if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapPolygon class]]) {
    ABI29_0_0AIRGoogleMapPolygon *polygon = (ABI29_0_0AIRGoogleMapPolygon*)subview;
    polygon.polygon.map = self;
    [self.polygons addObject:polygon];
  } else if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapPolyline class]]) {
    ABI29_0_0AIRGoogleMapPolyline *polyline = (ABI29_0_0AIRGoogleMapPolyline*)subview;
    polyline.polyline.map = self;
    [self.polylines addObject:polyline];
  } else if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapCircle class]]) {
    ABI29_0_0AIRGoogleMapCircle *circle = (ABI29_0_0AIRGoogleMapCircle*)subview;
    circle.circle.map = self;
    [self.circles addObject:circle];
  } else if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapUrlTile class]]) {
    ABI29_0_0AIRGoogleMapUrlTile *tile = (ABI29_0_0AIRGoogleMapUrlTile*)subview;
    tile.tileLayer.map = self;
    [self.tiles addObject:tile];
  } else if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapOverlay class]]) {
    ABI29_0_0AIRGoogleMapOverlay *overlay = (ABI29_0_0AIRGoogleMapOverlay*)subview;
    overlay.overlay.map = self;
    [self.overlays addObject:overlay];
  } else {
    NSArray<id<ABI29_0_0RCTComponent>> *childSubviews = [subview ReactABI29_0_0Subviews];
    for (int i = 0; i < childSubviews.count; i++) {
      [self insertReactABI29_0_0Subview:(UIView *)childSubviews[i] atIndex:atIndex];
    }
  }
  [_ReactABI29_0_0Subviews insertObject:(UIView *)subview atIndex:(NSUInteger) atIndex];
}
#pragma clang diagnostic pop


#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-missing-super-calls"
- (void)removeReactABI29_0_0Subview:(id<ABI29_0_0RCTComponent>)subview {
  // similarly, when the children are being removed we have to do the appropriate
  // underlying mapview action here.
  if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapMarker class]]) {
    ABI29_0_0AIRGoogleMapMarker *marker = (ABI29_0_0AIRGoogleMapMarker*)subview;
    marker.realMarker.map = nil;
    [self.markers removeObject:marker];
  } else if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapPolygon class]]) {
    ABI29_0_0AIRGoogleMapPolygon *polygon = (ABI29_0_0AIRGoogleMapPolygon*)subview;
    polygon.polygon.map = nil;
    [self.polygons removeObject:polygon];
  } else if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapPolyline class]]) {
    ABI29_0_0AIRGoogleMapPolyline *polyline = (ABI29_0_0AIRGoogleMapPolyline*)subview;
    polyline.polyline.map = nil;
    [self.polylines removeObject:polyline];
  } else if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapCircle class]]) {
    ABI29_0_0AIRGoogleMapCircle *circle = (ABI29_0_0AIRGoogleMapCircle*)subview;
    circle.circle.map = nil;
    [self.circles removeObject:circle];
  } else if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapUrlTile class]]) {
    ABI29_0_0AIRGoogleMapUrlTile *tile = (ABI29_0_0AIRGoogleMapUrlTile*)subview;
    tile.tileLayer.map = nil;
    [self.tiles removeObject:tile];
  } else if ([subview isKindOfClass:[ABI29_0_0AIRGoogleMapOverlay class]]) {
    ABI29_0_0AIRGoogleMapOverlay *overlay = (ABI29_0_0AIRGoogleMapOverlay*)subview;
    overlay.overlay.map = nil;
    [self.overlays removeObject:overlay];
  } else {
    NSArray<id<ABI29_0_0RCTComponent>> *childSubviews = [subview ReactABI29_0_0Subviews];
    for (int i = 0; i < childSubviews.count; i++) {
      [self removeReactABI29_0_0Subview:(UIView *)childSubviews[i]];
    }
  }
  [_ReactABI29_0_0Subviews removeObject:(UIView *)subview];
}
#pragma clang diagnostic pop

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-missing-super-calls"
- (NSArray<id<ABI29_0_0RCTComponent>> *)ReactABI29_0_0Subviews {
  return _ReactABI29_0_0Subviews;
}
#pragma clang diagnostic pop

- (void)didMoveToWindow {
  if (_didMoveToWindow) return;
  _didMoveToWindow = true;

  if (_initialRegion.span.latitudeDelta != 0.0 &&
      _initialRegion.span.longitudeDelta != 0.0) {
    self.camera = [ABI29_0_0AIRGoogleMap makeGMSCameraPositionFromMap:self andMKCoordinateRegion:_initialRegion];
  } else if (_region.span.latitudeDelta != 0.0 &&
      _region.span.longitudeDelta != 0.0) {
    self.camera = [ABI29_0_0AIRGoogleMap makeGMSCameraPositionFromMap:self andMKCoordinateRegion:_region];
  }

  [super didMoveToWindow];
}

- (void)setInitialRegion:(MKCoordinateRegion)initialRegion {
  if (_initialRegionSetOnLoad) return;
  _initialRegion = initialRegion;
  _initialRegionSetOnLoad = _didMoveToWindow;
  self.camera = [ABI29_0_0AIRGoogleMap makeGMSCameraPositionFromMap:self andMKCoordinateRegion:initialRegion];
}

- (void)setRegion:(MKCoordinateRegion)region {
  // TODO: The JS component is repeatedly setting region unnecessarily. We might want to deal with that in here.
  _region = region;
  self.camera = [ABI29_0_0AIRGoogleMap makeGMSCameraPositionFromMap:self  andMKCoordinateRegion:region];
}

- (void)didPrepareMap {
  if (_didCallOnMapReady) return;
  _didCallOnMapReady = true;
  if (self.onMapReady) self.onMapReady(@{});
}

- (BOOL)didTapMarker:(GMSMarker *)marker {
  ABI29_0_0AIRGMSMarker *airMarker = (ABI29_0_0AIRGMSMarker *)marker;

  id event = @{@"action": @"marker-press",
               @"id": airMarker.identifier ?: @"unknown",
               @"coordinate": @{
                   @"latitude": @(airMarker.position.latitude),
                   @"longitude": @(airMarker.position.longitude)
                   }
               };

  if (airMarker.onPress) airMarker.onPress(event);
  if (self.onMarkerPress) self.onMarkerPress(event);

  // TODO: not sure why this is necessary
  [self setSelectedMarker:marker];
  return NO;
}

- (void)didTapPolyline:(GMSOverlay *)polyline {
  ABI29_0_0AIRGMSPolyline *airPolyline = (ABI29_0_0AIRGMSPolyline *)polyline;

  id event = @{@"action": @"polyline-press",
               @"id": airPolyline.identifier ?: @"unknown",
               };

   if (airPolyline.onPress) airPolyline.onPress(event);
}

- (void)didTapPolygon:(GMSOverlay *)polygon {
    ABI29_0_0AIRGMSPolygon *airPolygon = (ABI29_0_0AIRGMSPolygon *)polygon;

    id event = @{@"action": @"polygon-press",
                 @"id": airPolygon.identifier ?: @"unknown",
                 };

    if (airPolygon.onPress) airPolygon.onPress(event);
}

- (void)didTapAtCoordinate:(CLLocationCoordinate2D)coordinate {
  if (!self.onPress) return;
  self.onPress([self eventFromCoordinate:coordinate]);
}

- (void)didLongPressAtCoordinate:(CLLocationCoordinate2D)coordinate {
  if (!self.onLongPress) return;
  self.onLongPress([self eventFromCoordinate:coordinate]);
}

- (void)didChangeCameraPosition:(GMSCameraPosition *)position {
  id event = @{@"continuous": @YES,
               @"region": regionAsJSON([ABI29_0_0AIRGoogleMap makeGMSCameraPositionFromMap:self andGMSCameraPosition:position]),
               };

  if (self.onChange) self.onChange(event);
}

- (void)didTapPOIWithPlaceID:(NSString *)placeID
                        name:(NSString *)name
                    location:(CLLocationCoordinate2D)location {
  id event = @{@"placeId": placeID,
               @"name": name,
               @"coordinate": @{
                   @"latitude": @(location.latitude),
                   @"longitude": @(location.longitude)
                   }
               };

  if (self.onPoiClick) self.onPoiClick(event);
}

- (void)idleAtCameraPosition:(GMSCameraPosition *)position {
  id event = @{@"continuous": @NO,
               @"region": regionAsJSON([ABI29_0_0AIRGoogleMap makeGMSCameraPositionFromMap:self andGMSCameraPosition:position]),
               };
  if (self.onChange) self.onChange(event);  // complete
}

- (void)setMapPadding:(UIEdgeInsets)mapPadding {
  self.padding = mapPadding;
}

- (UIEdgeInsets)mapPadding {
  return self.padding;
}

- (void)setScrollEnabled:(BOOL)scrollEnabled {
  self.settings.scrollGestures = scrollEnabled;
}

- (BOOL)scrollEnabled {
  return self.settings.scrollGestures;
}

- (void)setZoomEnabled:(BOOL)zoomEnabled {
  self.settings.zoomGestures = zoomEnabled;
}

- (BOOL)zoomEnabled {
  return self.settings.zoomGestures;
}

- (void)setRotateEnabled:(BOOL)rotateEnabled {
  self.settings.rotateGestures = rotateEnabled;
}

- (BOOL)rotateEnabled {
  return self.settings.rotateGestures;
}

- (void)setPitchEnabled:(BOOL)pitchEnabled {
  self.settings.tiltGestures = pitchEnabled;
}

- (BOOL)pitchEnabled {
  return self.settings.tiltGestures;
}

- (void)setShowsTraffic:(BOOL)showsTraffic {
  self.trafficEnabled = showsTraffic;
}

- (BOOL)showsTraffic {
  return self.trafficEnabled;
}

- (void)setShowsBuildings:(BOOL)showsBuildings {
  self.buildingsEnabled = showsBuildings;
}

- (BOOL)showsBuildings {
  return self.buildingsEnabled;
}

- (void)setShowsCompass:(BOOL)showsCompass {
  self.settings.compassButton = showsCompass;
}

- (void)setCustomMapStyleString:(NSString *)customMapStyleString {
  NSError *error;

  GMSMapStyle *style = [GMSMapStyle styleWithJSONString:customMapStyleString error:&error];

  if (!style) {
    NSLog(@"The style definition could not be loaded: %@", error);
  }

  self.mapStyle = style;
}

- (BOOL)showsCompass {
  return self.settings.compassButton;
}

- (void)setShowsUserLocation:(BOOL)showsUserLocation {
  self.myLocationEnabled = showsUserLocation;
}

- (BOOL)showsUserLocation {
  return self.myLocationEnabled;
}

- (void)setShowsMyLocationButton:(BOOL)showsMyLocationButton {
  self.settings.myLocationButton = showsMyLocationButton;
}

- (BOOL)showsMyLocationButton {
  return self.settings.myLocationButton;
}

- (void)setMinZoomLevel:(CGFloat)minZoomLevel {
  [self setMinZoom:minZoomLevel maxZoom:self.maxZoom ];
}

- (void)setMaxZoomLevel:(CGFloat)maxZoomLevel {
  [self setMinZoom:self.minZoom maxZoom:maxZoomLevel ];
}

- (void)setShowsIndoorLevelPicker:(BOOL)showsIndoorLevelPicker {
  self.settings.indoorPicker = showsIndoorLevelPicker;
}

- (BOOL)showsIndoorLevelPicker {
  return self.settings.indoorPicker;
}

+ (MKCoordinateRegion) makeGMSCameraPositionFromMap:(GMSMapView *)map andGMSCameraPosition:(GMSCameraPosition *)position {
  // solution from here: http://stackoverflow.com/a/16587735/1102215
  GMSVisibleRegion visibleRegion = map.projection.visibleRegion;
  GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithRegion: visibleRegion];
  CLLocationCoordinate2D center;
  CLLocationDegrees longitudeDelta;
  CLLocationDegrees latitudeDelta = bounds.northEast.latitude - bounds.southWest.latitude;

  if(bounds.northEast.longitude >= bounds.southWest.longitude) {
    //Standard case
    center = CLLocationCoordinate2DMake((bounds.southWest.latitude + bounds.northEast.latitude) / 2,
                                        (bounds.southWest.longitude + bounds.northEast.longitude) / 2);
    longitudeDelta = bounds.northEast.longitude - bounds.southWest.longitude;
  } else {
    //Region spans the international dateline
    center = CLLocationCoordinate2DMake((bounds.southWest.latitude + bounds.northEast.latitude) / 2,
                                        (bounds.southWest.longitude + bounds.northEast.longitude + 360) / 2);
    longitudeDelta = bounds.northEast.longitude + 360 - bounds.southWest.longitude;
  }
  MKCoordinateSpan span = MKCoordinateSpanMake(latitudeDelta, longitudeDelta);
  return MKCoordinateRegionMake(center, span);
}

+ (GMSCameraPosition*) makeGMSCameraPositionFromMap:(GMSMapView *)map andMKCoordinateRegion:(MKCoordinateRegion)region {
  float latitudeDelta = region.span.latitudeDelta * 0.5;
  float longitudeDelta = region.span.longitudeDelta * 0.5;

  CLLocationCoordinate2D a = CLLocationCoordinate2DMake(region.center.latitude + latitudeDelta,
                                                        region.center.longitude + longitudeDelta);
  CLLocationCoordinate2D b = CLLocationCoordinate2DMake(region.center.latitude - latitudeDelta,
                                                        region.center.longitude - longitudeDelta);
  GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:a coordinate:b];
  return [map cameraForBounds:bounds insets:UIEdgeInsetsZero];
}

#pragma mark - KVO updates

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context {
  if ([keyPath isEqualToString:@"myLocation"]){
    CLLocation *location = [object myLocation];

    id event = @{@"coordinate": @{
                    @"latitude": @(location.coordinate.latitude),
                    @"longitude": @(location.coordinate.longitude),
                    @"altitude": @(location.altitude),
                    @"accuracy": @(location.horizontalAccuracy),
                    @"altitudeAccuracy": @(location.verticalAccuracy),
                    @"speed": @(location.speed),
                    }
                };

  if (self.onUserLocationChange) self.onUserLocationChange(event);
  } else {
    // This message is not for me; pass it on to super.
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}

+ (NSString *)GetIconUrl:(GMUPlacemark *) marker parser:(GMUKMLParser *) parser {
  if (marker.style.styleID != nil) {
    for (GMUStyle *style in parser.styles) {
      if (style.styleID == marker.style.styleID) {
        return style.iconUrl;
      }
    }
  }

  return marker.style.iconUrl;
}

- (NSString *)KmlSrc {
  return _kmlSrc;
}

- (void)setKmlSrc:(NSString *)kmlUrl {

  _kmlSrc = kmlUrl;

  NSURL *url = [NSURL URLWithString:kmlUrl];
  NSData *urlData = nil;

  if ([url isFileURL]) {
    urlData = [NSData dataWithContentsOfURL:url];
  } else {
    urlData = [[NSFileManager defaultManager] contentsAtPath:kmlUrl];
  }

  GMUKMLParser *parser = [[GMUKMLParser alloc] initWithData:urlData];
  [parser parse];

  NSUInteger index = 0;
  NSMutableArray *markers = [[NSMutableArray alloc]init];

  for (GMUPlacemark *place in parser.placemarks) {

    CLLocationCoordinate2D location =((GMUPoint *) place.geometry).coordinate;

    ABI29_0_0AIRGoogleMapMarker *marker = (ABI29_0_0AIRGoogleMapMarker *)[[ABI29_0_0AIRGoogleMapMarkerManager alloc] view];
    if (!marker.bridge) {
      marker.bridge = _bridge;
    }
    marker.identifier = place.title;
    marker.coordinate = location;
    marker.title = place.title;
    marker.subtitle = place.snippet;
    marker.pinColor = place.style.fillColor;
    marker.imageSrc = [ABI29_0_0AIRGoogleMap GetIconUrl:place parser:parser];
    marker.layer.backgroundColor = [UIColor clearColor].CGColor;
    marker.layer.position = CGPointZero;

    [self insertReactABI29_0_0Subview:(UIView *) marker atIndex:index];

    [markers addObject:@{@"id": marker.identifier,
                         @"title": marker.title,
                         @"description": marker.subtitle,
                         @"coordinate": @{
                             @"latitude": @(location.latitude),
                             @"longitude": @(location.longitude)
                             }
                         }];

    index++;
  }

  id event = @{@"markers": markers};
  if (self.onKmlReady) self.onKmlReady(event);
}

@end
