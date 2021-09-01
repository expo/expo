//
//  AIRGoogleMap.m
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef HAVE_GOOGLE_MAPS

#import "AIRGoogleMap.h"
#import "AIRGoogleMapMarker.h"
#import "AIRGoogleMapMarkerManager.h"
#import "AIRGoogleMapPolygon.h"
#import "AIRGoogleMapPolyline.h"
#import "AIRGoogleMapCircle.h"
#import "AIRGoogleMapHeatmap.h"
#import "AIRGoogleMapUrlTile.h"
#import "AIRGoogleMapWMSTile.h"
#import "AIRGoogleMapOverlay.h"
#import <GoogleMaps/GoogleMaps.h>
#import <MapKit/MapKit.h>
#import <React/UIView+React.h>
#import <React/RCTBridge.h>
#import "RCTConvert+AirMap.h"
#import <objc/runtime.h>

#ifdef HAVE_GOOGLE_MAPS_UTILS
#import <Google-Maps-iOS-Utils/GMUKMLParser.h>
#import <Google-Maps-iOS-Utils/GMUPlacemark.h>
#import <Google-Maps-iOS-Utils/GMUPoint.h>
#import <Google-Maps-iOS-Utils/GMUGeometryRenderer.h>
#define REQUIRES_GOOGLE_MAPS_UTILS(feature) do {} while (0)
#else
#define GMUKMLParser void
#define GMUPlacemark void
#define REQUIRES_GOOGLE_MAPS_UTILS(feature) do { \
 [NSException raise:@"ReactNativeMapsDependencyMissing" \
             format:@"Use of " feature "requires Google-Maps-iOS-Utils, you  must install via CocoaPods to use this feature"]; \
} while (0)
#endif


id regionAsJSON(MKCoordinateRegion region) {
  return @{
           @"latitude": [NSNumber numberWithDouble:region.center.latitude],
           @"longitude": [NSNumber numberWithDouble:region.center.longitude],
           @"latitudeDelta": [NSNumber numberWithDouble:region.span.latitudeDelta],
           @"longitudeDelta": [NSNumber numberWithDouble:region.span.longitudeDelta],
           };
}

@interface AIRGoogleMap () <GMSIndoorDisplayDelegate>

- (id)eventFromCoordinate:(CLLocationCoordinate2D)coordinate;

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, NSDictionary*> *origGestureRecognizersMeta;

@end

@implementation AIRGoogleMap
{
  NSMutableArray<UIView *> *_reactSubviews;
  MKCoordinateRegion _initialRegion;
  MKCoordinateRegion _region;
  BOOL _initialCameraSetOnLoad;
  BOOL _didCallOnMapReady;
  BOOL _didMoveToWindow;
  BOOL _zoomTapEnabled;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _reactSubviews = [NSMutableArray new];
    _markers = [NSMutableArray array];
    _polygons = [NSMutableArray array];
    _polylines = [NSMutableArray array];
    _circles = [NSMutableArray array];
    _heatmaps = [NSMutableArray array];
    _tiles = [NSMutableArray array];
    _overlays = [NSMutableArray array];
    _initialCamera = nil;
    _cameraProp = nil;
    _initialRegion = MKCoordinateRegionMake(CLLocationCoordinate2DMake(0.0, 0.0), MKCoordinateSpanMake(0.0, 0.0));
    _region = MKCoordinateRegionMake(CLLocationCoordinate2DMake(0.0, 0.0), MKCoordinateSpanMake(0.0, 0.0));
    _initialCameraSetOnLoad = false;
    _didCallOnMapReady = false;
    _didMoveToWindow = false;
    _zoomTapEnabled = YES;

    // Listen to the myLocation property of GMSMapView.
    [self addObserver:self
           forKeyPath:@"myLocation"
              options:NSKeyValueObservingOptionNew
              context:NULL];

    self.origGestureRecognizersMeta = [[NSMutableDictionary alloc] init];

    self.indoorDisplay.delegate = self;
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
- (void)insertReactSubview:(id<RCTComponent>)subview atIndex:(NSInteger)atIndex {
  // Our desired API is to pass up markers/overlays as children to the mapview component.
  // This is where we intercept them and do the appropriate underlying mapview action.
  if ([subview isKindOfClass:[AIRGoogleMapMarker class]]) {
    AIRGoogleMapMarker *marker = (AIRGoogleMapMarker*)subview;
    marker.realMarker.map = self;
    [self.markers addObject:marker];
  } else if ([subview isKindOfClass:[AIRGoogleMapPolygon class]]) {
    AIRGoogleMapPolygon *polygon = (AIRGoogleMapPolygon*)subview;
    polygon.polygon.map = self;
    [self.polygons addObject:polygon];
  } else if ([subview isKindOfClass:[AIRGoogleMapPolyline class]]) {
    AIRGoogleMapPolyline *polyline = (AIRGoogleMapPolyline*)subview;
    polyline.polyline.map = self;
    [self.polylines addObject:polyline];
  } else if ([subview isKindOfClass:[AIRGoogleMapCircle class]]) {
    AIRGoogleMapCircle *circle = (AIRGoogleMapCircle*)subview;
    circle.circle.map = self;
    [self.circles addObject:circle];
  } else if ([subview isKindOfClass:[AIRGoogleMapUrlTile class]]) {
    AIRGoogleMapUrlTile *tile = (AIRGoogleMapUrlTile*)subview;
    tile.tileLayer.map = self;
    [self.tiles addObject:tile];
  } else if ([subview isKindOfClass:[AIRGoogleMapWMSTile class]]) {
    AIRGoogleMapWMSTile *tile = (AIRGoogleMapWMSTile*)subview;
    tile.tileLayer.map = self;
    [self.tiles addObject:tile];
  } else if ([subview isKindOfClass:[AIRGoogleMapOverlay class]]) {
    AIRGoogleMapOverlay *overlay = (AIRGoogleMapOverlay*)subview;
    overlay.overlay.map = self;
    [self.overlays addObject:overlay];
  } else if ([subview isKindOfClass:[AIRGoogleMapHeatmap class]]){
    AIRGoogleMapHeatmap *heatmap = (AIRGoogleMapHeatmap*)subview;
    heatmap.heatmap.map = self;
    [self.heatmaps addObject:heatmap];
  } else {
    NSArray<id<RCTComponent>> *childSubviews = [subview reactSubviews];
    for (int i = 0; i < childSubviews.count; i++) {
      [self insertReactSubview:(UIView *)childSubviews[i] atIndex:atIndex];
    }
  }
  [_reactSubviews insertObject:(UIView *)subview atIndex:(NSUInteger) atIndex];
}
#pragma clang diagnostic pop


#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-missing-super-calls"
- (void)removeReactSubview:(id<RCTComponent>)subview {
  // similarly, when the children are being removed we have to do the appropriate
  // underlying mapview action here.
  if ([subview isKindOfClass:[AIRGoogleMapMarker class]]) {
    AIRGoogleMapMarker *marker = (AIRGoogleMapMarker*)subview;
    marker.realMarker.map = nil;
    [self.markers removeObject:marker];
  } else if ([subview isKindOfClass:[AIRGoogleMapPolygon class]]) {
    AIRGoogleMapPolygon *polygon = (AIRGoogleMapPolygon*)subview;
    polygon.polygon.map = nil;
    [self.polygons removeObject:polygon];
  } else if ([subview isKindOfClass:[AIRGoogleMapPolyline class]]) {
    AIRGoogleMapPolyline *polyline = (AIRGoogleMapPolyline*)subview;
    polyline.polyline.map = nil;
    [self.polylines removeObject:polyline];
  } else if ([subview isKindOfClass:[AIRGoogleMapCircle class]]) {
    AIRGoogleMapCircle *circle = (AIRGoogleMapCircle*)subview;
    circle.circle.map = nil;
    [self.circles removeObject:circle];
  } else if ([subview isKindOfClass:[AIRGoogleMapUrlTile class]]) {
    AIRGoogleMapUrlTile *tile = (AIRGoogleMapUrlTile*)subview;
    tile.tileLayer.map = nil;
    [self.tiles removeObject:tile];
  } else if ([subview isKindOfClass:[AIRGoogleMapWMSTile class]]) {
    AIRGoogleMapWMSTile *tile = (AIRGoogleMapWMSTile*)subview;
    tile.tileLayer.map = nil;
    [self.tiles removeObject:tile];
  } else if ([subview isKindOfClass:[AIRGoogleMapOverlay class]]) {
    AIRGoogleMapOverlay *overlay = (AIRGoogleMapOverlay*)subview;
    overlay.overlay.map = nil;
    [self.overlays removeObject:overlay];
  } else if ([subview isKindOfClass:[AIRGoogleMapHeatmap class]]){
    AIRGoogleMapHeatmap *heatmap = (AIRGoogleMapHeatmap*)subview;
    heatmap.heatmap.map = nil;
    [self.heatmaps removeObject:heatmap];
  } else {
    NSArray<id<RCTComponent>> *childSubviews = [subview reactSubviews];
    for (int i = 0; i < childSubviews.count; i++) {
      [self removeReactSubview:(UIView *)childSubviews[i]];
    }
  }
  [_reactSubviews removeObject:(UIView *)subview];
}
#pragma clang diagnostic pop

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-missing-super-calls"
- (NSArray<id<RCTComponent>> *)reactSubviews {
  return _reactSubviews;
}
#pragma clang diagnostic pop

- (NSArray *)getMapBoundaries
{
    GMSVisibleRegion visibleRegion = self.projection.visibleRegion;
    GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithRegion:visibleRegion];

    CLLocationCoordinate2D northEast = bounds.northEast;
    CLLocationCoordinate2D southWest = bounds.southWest;

    return @[
        @[
            [NSNumber numberWithDouble:northEast.longitude],
            [NSNumber numberWithDouble:northEast.latitude]
        ],
        @[
            [NSNumber numberWithDouble:southWest.longitude],
            [NSNumber numberWithDouble:southWest.latitude]
        ]
    ];
}

- (void)didMoveToWindow {
  if (_didMoveToWindow) return;
  _didMoveToWindow = true;

  if (_initialCamera != nil) {
    self.camera = _initialCamera;
  }
  else if (_initialRegion.span.latitudeDelta != 0.0 &&
      _initialRegion.span.longitudeDelta != 0.0) {
    self.camera = [AIRGoogleMap makeGMSCameraPositionFromMap:self andMKCoordinateRegion:_initialRegion];
  } else if (_region.span.latitudeDelta != 0.0 &&
      _region.span.longitudeDelta != 0.0) {
    self.camera = [AIRGoogleMap makeGMSCameraPositionFromMap:self andMKCoordinateRegion:_region];
  }

  [super didMoveToWindow];
}

- (void)setInitialRegion:(MKCoordinateRegion)initialRegion {
  if (_initialCameraSetOnLoad) return;
  _initialRegion = initialRegion;
  _initialCameraSetOnLoad = _didMoveToWindow;
  self.camera = [AIRGoogleMap makeGMSCameraPositionFromMap:self andMKCoordinateRegion:initialRegion];
}

- (void)setInitialCamera:(GMSCameraPosition*)initialCamera {
    if (_initialCameraSetOnLoad) return;
    _initialCamera = initialCamera;
    _initialCameraSetOnLoad = _didMoveToWindow;
    self.camera = initialCamera;
}

- (void)setRegion:(MKCoordinateRegion)region {
  // TODO: The JS component is repeatedly setting region unnecessarily. We might want to deal with that in here.
  _region = region;
  self.camera = [AIRGoogleMap makeGMSCameraPositionFromMap:self  andMKCoordinateRegion:region];
}

- (void)setCameraProp:(GMSCameraPosition*)camera {
    _initialCamera = camera;
    self.camera = camera;
}


- (void)didPrepareMap {
  UIView* mapView = [self valueForKey:@"mapView"]; //GMSVectorMapView
  [self overrideGestureRecognizersForView:mapView];

  if (_didCallOnMapReady) return;
  _didCallOnMapReady = true;
  if (self.onMapReady) self.onMapReady(@{});
}

- (void)mapViewDidFinishTileRendering {
  if (self.onMapLoaded) self.onMapLoaded(@{});
}

- (BOOL)didTapMarker:(GMSMarker *)marker {
  AIRGMSMarker *airMarker = (AIRGMSMarker *)marker;

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
  AIRGMSPolyline *airPolyline = (AIRGMSPolyline *)polyline;

  id event = @{@"action": @"polyline-press",
               @"id": airPolyline.identifier ?: @"unknown",
               };

   if (airPolyline.onPress) airPolyline.onPress(event);
}

- (void)didTapPolygon:(GMSOverlay *)polygon {
    AIRGMSPolygon *airPolygon = (AIRGMSPolygon *)polygon;

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

- (void)didChangeCameraPosition:(GMSCameraPosition *)position isGesture:(BOOL)isGesture{
  id event = @{@"continuous": @YES,
               @"region": regionAsJSON([AIRGoogleMap makeGMSCameraPositionFromMap:self andGMSCameraPosition:position]),
               @"isGesture": [NSNumber numberWithBool:isGesture],
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

- (void)idleAtCameraPosition:(GMSCameraPosition *)position  isGesture:(BOOL)isGesture{
  id event = @{@"continuous": @NO,
               @"region": regionAsJSON([AIRGoogleMap makeGMSCameraPositionFromMap:self andGMSCameraPosition:position]),
               @"isGesture": [NSNumber numberWithBool:isGesture],
               };
  if (self.onChange) self.onChange(event);  // complete
}

- (void)setMapPadding:(UIEdgeInsets)mapPadding {
  self.padding = mapPadding;
}

- (UIEdgeInsets)mapPadding {
  return self.padding;
}

- (void)setPaddingAdjustmentBehaviorString:(NSString *)str
{
  if ([str isEqualToString:@"never"])
  {
    self.paddingAdjustmentBehavior = kGMSMapViewPaddingAdjustmentBehaviorNever;
  }
  else if ([str isEqualToString:@"automatic"])
  {
    self.paddingAdjustmentBehavior = kGMSMapViewPaddingAdjustmentBehaviorAutomatic;
  }
  else //if ([str isEqualToString:@"always"]) <-- default
  {
    self.paddingAdjustmentBehavior = kGMSMapViewPaddingAdjustmentBehaviorAlways;
  }
}

- (NSString *)paddingAdjustmentBehaviorString
{
  switch (self.paddingAdjustmentBehavior)
  {
    case kGMSMapViewPaddingAdjustmentBehaviorNever:
      return @"never";
    case kGMSMapViewPaddingAdjustmentBehaviorAutomatic:
      return @"automatic";
    case kGMSMapViewPaddingAdjustmentBehaviorAlways:
      return @"always";

    default:
      return @"unknown";
  }
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

- (void)setScrollDuringRotateOrZoomEnabled:(BOOL)enableScrollGesturesDuringRotateOrZoom {
  self.settings.allowScrollGesturesDuringRotateOrZoom = enableScrollGesturesDuringRotateOrZoom;
}

- (BOOL)scrollDuringRotateOrZoomEnabled {
  return self.settings.allowScrollGesturesDuringRotateOrZoom;
}

- (void)setZoomTapEnabled:(BOOL)zoomTapEnabled {
    _zoomTapEnabled = zoomTapEnabled;
}

- (BOOL)zoomTapEnabled {
    return _zoomTapEnabled;
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

- (void)setShowsIndoors:(BOOL)showsIndoors {
  self.indoorEnabled = showsIndoors;
}

- (BOOL)showsIndoors {
  return self.indoorEnabled;
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

#pragma mark - Utils

- (CGRect) frameForMarker:(AIRGoogleMapMarker*) mrkView {
    CGPoint mrkAnchor = mrkView.realMarker.groundAnchor;
    CGPoint mrkPoint = [self.projection pointForCoordinate:mrkView.coordinate];
    CGSize mrkSize = mrkView.realMarker.iconView ? mrkView.realMarker.iconView.bounds.size : CGSizeMake(20, 30);
    CGRect mrkFrame = CGRectMake(mrkPoint.x, mrkPoint.y, mrkSize.width, mrkSize.height);
    mrkFrame.origin.y -= mrkAnchor.y * mrkSize.height;
    mrkFrame.origin.x -= mrkAnchor.x * mrkSize.width;
    return mrkFrame;
}

- (NSDictionary*) getMarkersFramesWithOnlyVisible:(BOOL)onlyVisible {
    NSMutableDictionary* markersFrames = [NSMutableDictionary new];
    for (AIRGoogleMapMarker* mrkView in self.markers) {
        CGRect frame = [self frameForMarker:mrkView];
        CGPoint point = [self.projection pointForCoordinate:mrkView.coordinate];
        NSDictionary* frameDict = @{
                                    @"x": @(frame.origin.x),
                                    @"y": @(frame.origin.y),
                                    @"width": @(frame.size.width),
                                    @"height": @(frame.size.height)
                                    };
        NSDictionary* pointDict = @{
                                    @"x": @(point.x),
                                    @"y": @(point.y)
                                    };
        NSString* k = mrkView.identifier;
        BOOL isVisible = CGRectIntersectsRect(self.bounds, frame);
        if (k != nil && (!onlyVisible || isVisible)) {
            [markersFrames setObject:@{ @"frame": frameDict, @"point": pointDict } forKey:k];
        }
    }
    return markersFrames;
}

- (AIRGoogleMapMarker*) markerAtPoint:(CGPoint)point {
    AIRGoogleMapMarker* mrk = nil;
    for (AIRGoogleMapMarker* mrkView in self.markers) {
        CGRect frame = [self frameForMarker:mrkView];
        if (CGRectContainsPoint(frame, point)) {
            mrk = mrkView;
            break;
        }
    }
    return mrk;
}

-(SEL)getActionForTarget:(NSObject*)target {
    SEL action = nil;
    uint32_t ivarCount;
    Ivar *ivars = class_copyIvarList([target class], &ivarCount);
    if (ivars) {
        for (uint32_t i = 0 ; i < ivarCount ; i++) {
            Ivar ivar = ivars[i];
            const char* type = ivar_getTypeEncoding(ivar);
            const char* ivarName = ivar_getName(ivar);
            NSString* name = [NSString stringWithCString: ivarName encoding: NSASCIIStringEncoding];
            if (type[0] == ':' && [name isEqualToString:@"_action"]) {
                SEL sel = ((SEL (*)(id, Ivar))object_getIvar)(target, ivar);
                action = sel;
                break;
            }
        }
    }
    free(ivars);
    return action;
}

#pragma mark - Overrides for Callout behavior

-(void)overrideGestureRecognizersForView:(UIView*)view {
    NSArray* grs = view.gestureRecognizers;
    for (UIGestureRecognizer* gestureRecognizer in grs) {
        NSNumber* grHash = [NSNumber numberWithUnsignedInteger:gestureRecognizer.hash];
        if([self.origGestureRecognizersMeta objectForKey:grHash] != nil)
            continue; //already patched

        //get original handlers
        NSArray* origTargets = [gestureRecognizer valueForKey:@"targets"];
        NSMutableArray* origTargetsActions = [[NSMutableArray alloc] init];
        BOOL isZoomTapGesture = NO;
        for (NSObject* trg in origTargets) {
            NSObject* target = [trg valueForKey:@"target"];
            SEL action = [self getActionForTarget:trg];
            isZoomTapGesture = [NSStringFromSelector(action) isEqualToString:@"handleZoomTapGesture:"];
            [origTargetsActions addObject:@{
                                            @"target": [NSValue valueWithNonretainedObject:target],
                                            @"action": NSStringFromSelector(action)
                                            }];
        }
        if (isZoomTapGesture && self.zoomTapEnabled == NO) {
            [view removeGestureRecognizer:gestureRecognizer];
            continue;
        }

        //replace with extendedMapGestureHandler
        for (NSDictionary* origTargetAction in origTargetsActions) {
            NSValue* targetValue = [origTargetAction objectForKey:@"target"];
            NSObject* target = [targetValue nonretainedObjectValue];
            NSString* actionString = [origTargetAction objectForKey:@"action"];
            SEL action = NSSelectorFromString(actionString);
            [gestureRecognizer removeTarget:target action:action];
        }
        [gestureRecognizer addTarget:self action:@selector(extendedMapGestureHandler:)];

        [self.origGestureRecognizersMeta setObject:@{@"targets": origTargetsActions}
                                            forKey:grHash];
    }
}

- (id)extendedMapGestureHandler:(UIGestureRecognizer*)gestureRecognizer {
    NSNumber* grHash = [NSNumber numberWithUnsignedInteger:gestureRecognizer.hash];
    UIWindow* win = [[[UIApplication sharedApplication] windows] firstObject];
    NSObject* bubbleProvider = [self valueForKey:@"bubbleProvider"]; //GMSbubbleEntityProvider
    CGRect bubbleAbsoluteFrame = [bubbleProvider accessibilityFrame];
    CGRect bubbleFrame = [win convertRect:bubbleAbsoluteFrame toView:self];
    UIView* bubbleView = [bubbleProvider valueForKey:@"view"];

    BOOL performOriginalActions = YES;
    BOOL isTap = [gestureRecognizer isKindOfClass:[UITapGestureRecognizer class]] || [gestureRecognizer isMemberOfClass:[UITapGestureRecognizer class]];
    if (isTap) {
        BOOL isTapInsideBubble = NO;
    CGPoint tapPoint = CGPointZero;
    CGPoint tapPointInBubble = CGPointZero;

    NSArray* touches = [gestureRecognizer valueForKey:@"touches"];
    UITouch* oneTouch = [touches firstObject];
    NSArray* delayedTouches = [gestureRecognizer valueForKey:@"delayedTouches"];
    NSObject* delayedTouch = [delayedTouches firstObject]; //UIGestureDeleayedTouch
    UITouch* tapTouch = [delayedTouch valueForKey:@"stateWhenDelayed"];
    if (!tapTouch)
        tapTouch = oneTouch;
        tapPoint = [tapTouch locationInView:self];
        isTapInsideBubble = tapTouch != nil && CGRectContainsPoint(bubbleFrame, tapPoint);
        if (isTapInsideBubble) {
            tapPointInBubble = CGPointMake(tapPoint.x - bubbleFrame.origin.x, tapPoint.y - bubbleFrame.origin.y);
        }
        if (isTapInsideBubble) {
            //find bubble's marker
            AIRGoogleMapMarker* markerView = nil;
            AIRGMSMarker* marker = nil;
            for (AIRGoogleMapMarker* mrk in self.markers) {
                if ([mrk.calloutView isEqual:bubbleView]) {
                    markerView = mrk;
                    marker = markerView.realMarker;
                    break;
                }
            }

            //find real tap target subview
            UIView* realSubview = [(RCTView*)bubbleView hitTest:tapPointInBubble withEvent:nil];
            AIRGoogleMapCalloutSubview* realPressableSubview = nil;
            if (realSubview) {
                UIView* tmp = realSubview;
                while (tmp && tmp != win && tmp != bubbleView) {
                    if ([tmp respondsToSelector:@selector(onPress)]) {
                        realPressableSubview = (AIRGoogleMapCalloutSubview*) tmp;
                        break;
                    }
                    tmp = tmp.superview;
                }
            }

            if (markerView) {
                BOOL isInsideCallout = [markerView.calloutView isPointInside:tapPointInBubble];
                if (isInsideCallout) {
                    [markerView didTapInfoWindowOfMarker:marker subview:realPressableSubview point:tapPointInBubble frame:bubbleFrame];
                } else {
                    AIRGoogleMapMarker* markerAtTapPoint = [self markerAtPoint:tapPoint];
                    if (markerAtTapPoint != nil) {
                        [self didTapMarker:markerAtTapPoint.realMarker];
                    } else {
                        CLLocationCoordinate2D coord = [self.projection coordinateForPoint:tapPoint];
                        [markerView hideCalloutView];
                        [self didTapAtCoordinate:coord];
                    }
                }

                performOriginalActions = NO;
            }
        }
    }

    if (performOriginalActions) {
        NSDictionary* origMeta = [self.origGestureRecognizersMeta objectForKey:grHash];
        NSDictionary* origTargets = [origMeta objectForKey:@"targets"];
        for (NSDictionary* origTarget in origTargets) {
            NSValue* targetValue = [origTarget objectForKey:@"target"];
            NSObject* target = [targetValue nonretainedObjectValue];
            NSString* actionString = [origTarget objectForKey:@"action"];
            SEL action = NSSelectorFromString(actionString);
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            [target performSelector:action withObject:gestureRecognizer];
#pragma clang diagnostic pop
        }
    }

    return nil;
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
                    @"timestamp": @(location.timestamp.timeIntervalSinceReferenceDate * 1000),
                    @"accuracy": @(location.horizontalAccuracy),
                    @"altitudeAccuracy": @(location.verticalAccuracy),
                    @"speed": @(location.speed),
                    @"heading": @(location.course),
                    }
                };

  if (self.onUserLocationChange) self.onUserLocationChange(event);
  } else {
    // This message is not for me; pass it on to super.
    [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
  }
}

+ (NSString *)GetIconUrl:(GMUPlacemark *) marker parser:(GMUKMLParser *) parser {
#ifdef HAVE_GOOGLE_MAPS_UTILS
  if (marker.style.styleID != nil) {
    for (GMUStyle *style in parser.styles) {
      if (style.styleID == marker.style.styleID) {
        return style.iconUrl;
      }
    }
  }

  return marker.style.iconUrl;
#else
    REQUIRES_GOOGLE_MAPS_UTILS("GetIconUrl:parser:"); return @"";
#endif
}

- (NSString *)KmlSrc {
  return _kmlSrc;
}

- (void)setKmlSrc:(NSString *)kmlUrl {
#ifdef HAVE_GOOGLE_MAPS_UTILS

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

    AIRGoogleMapMarker *marker = (AIRGoogleMapMarker *)[[AIRGoogleMapMarkerManager alloc] view];
    if (!marker.bridge) {
      marker.bridge = _bridge;
    }
    marker.identifier = place.title;
    marker.coordinate = location;
    marker.title = place.title;
    marker.subtitle = place.snippet;
    marker.pinColor = place.style.fillColor;
    marker.imageSrc = [AIRGoogleMap GetIconUrl:place parser:parser];
    marker.layer.backgroundColor = [UIColor clearColor].CGColor;
    marker.layer.position = CGPointZero;

    [self insertReactSubview:(UIView *) marker atIndex:index];

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
#else
    REQUIRES_GOOGLE_MAPS_UTILS();
#endif
}


- (void) didChangeActiveBuilding: (nullable GMSIndoorBuilding *) building {
    if (!building) {
        if (!self.onIndoorBuildingFocused) {
            return;
        }
        self.onIndoorBuildingFocused(@{
            @"IndoorBuilding": @{
                    @"activeLevelIndex": @0,
                    @"underground": @false,
                    @"levels": [[NSMutableArray alloc]init]
            }
        });
    }
    NSInteger i = 0;
    NSMutableArray *arrayLevels = [[NSMutableArray alloc]init];
    for (GMSIndoorLevel *level in building.levels) {
        [arrayLevels addObject: @{
            @"index": @(i),
            @"name" : level.name,
            @"shortName" : level.shortName,
        }];
        i++;
    }
    if (!self.onIndoorBuildingFocused) {
        return;
    }
    self.onIndoorBuildingFocused(@{
        @"IndoorBuilding": @{
                @"activeLevelIndex": @(building.defaultLevelIndex),
                @"underground": @(building.underground),
                @"levels": arrayLevels
        }
    });
}

- (void) didChangeActiveLevel: (nullable GMSIndoorLevel *)     level {
    if (!self.onIndoorLevelActivated || !self.indoorDisplay  || !level) {
        return;
    }
    NSInteger i = 0;
    for (GMSIndoorLevel *buildingLevel in self.indoorDisplay.activeBuilding.levels) {
        if (buildingLevel.name == level.name && buildingLevel.shortName == level.shortName) {
            break;
        }
        i++;
    }
    self.onIndoorLevelActivated(@{
        @"IndoorLevel": @{
                @"activeLevelIndex": @(i),
                @"name": level.name,
                @"shortName": level.shortName
        }
    });
}


@end

#endif
