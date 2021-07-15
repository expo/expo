//
//  AIRGoogleMap.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>
#import <React/RCTBridge.h>
#import <GoogleMaps/GoogleMaps.h>
#import <MapKit/MapKit.h>
#import "AIRGMSMarker.h"
#import "RCTConvert+AirMap.h"

@interface AIRGoogleMap : GMSMapView

// TODO: don't use MK region?
@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, assign) MKCoordinateRegion initialRegion;
@property (nonatomic, assign) MKCoordinateRegion region;
@property (nonatomic, assign) GMSCameraPosition *cameraProp;   // Because the base class already has a "camera" prop.
@property (nonatomic, assign) GMSCameraPosition *initialCamera;
@property (nonatomic, assign) NSString *customMapStyleString;
@property (nonatomic, assign) UIEdgeInsets mapPadding;
@property (nonatomic, assign) NSString *paddingAdjustmentBehaviorString;
@property (nonatomic, copy) RCTBubblingEventBlock onMapReady;
@property (nonatomic, copy) RCTBubblingEventBlock onMapLoaded;
@property (nonatomic, copy) RCTBubblingEventBlock onKmlReady;
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@property (nonatomic, copy) RCTBubblingEventBlock onLongPress;
@property (nonatomic, copy) RCTBubblingEventBlock onPanDrag;
@property (nonatomic, copy) RCTBubblingEventBlock onUserLocationChange;
@property (nonatomic, copy) RCTBubblingEventBlock onMarkerPress;
@property (nonatomic, copy) RCTBubblingEventBlock onChange;
@property (nonatomic, copy) RCTBubblingEventBlock onPoiClick;
@property (nonatomic, copy) RCTDirectEventBlock onRegionChange;
@property (nonatomic, copy) RCTDirectEventBlock onRegionChangeComplete;
@property (nonatomic, copy) RCTDirectEventBlock onIndoorLevelActivated;
@property (nonatomic, copy) RCTDirectEventBlock onIndoorBuildingFocused;
@property (nonatomic, strong) NSMutableArray *markers;
@property (nonatomic, strong) NSMutableArray *polygons;
@property (nonatomic, strong) NSMutableArray *polylines;
@property (nonatomic, strong) NSMutableArray *circles;
@property (nonatomic, strong) NSMutableArray *heatmaps;
@property (nonatomic, strong) NSMutableArray *tiles;
@property (nonatomic, strong) NSMutableArray *overlays;

@property (nonatomic, assign) BOOL showsBuildings;
@property (nonatomic, assign) BOOL showsTraffic;
@property (nonatomic, assign) BOOL showsCompass;
@property (nonatomic, assign) BOOL scrollEnabled;
@property (nonatomic, assign) BOOL zoomEnabled;
@property (nonatomic, assign) BOOL rotateEnabled;
@property (nonatomic, assign) BOOL pitchEnabled;
@property (nonatomic, assign) BOOL zoomTapEnabled;
@property (nonatomic, assign) BOOL showsUserLocation;
@property (nonatomic, assign) BOOL showsMyLocationButton;
@property (nonatomic, assign) BOOL showsIndoors;
@property (nonatomic, assign) BOOL showsIndoorLevelPicker;
@property (nonatomic, assign) NSString *kmlSrc;

- (void)didPrepareMap;
- (void)mapViewDidFinishTileRendering;
- (BOOL)didTapMarker:(GMSMarker *)marker;
- (void)didTapPolyline:(GMSPolyline *)polyline;
- (void)didTapPolygon:(GMSPolygon *)polygon;
- (void)didTapAtCoordinate:(CLLocationCoordinate2D)coordinate;
- (void)didLongPressAtCoordinate:(CLLocationCoordinate2D)coordinate;
- (void)didChangeCameraPosition:(GMSCameraPosition *)position isGesture:(BOOL)isGesture;
- (void)idleAtCameraPosition:(GMSCameraPosition *)position isGesture:(BOOL)isGesture;
- (void)didTapPOIWithPlaceID:(NSString *)placeID name:(NSString *) name location:(CLLocationCoordinate2D) location;
- (NSArray *)getMapBoundaries;

+ (MKCoordinateRegion)makeGMSCameraPositionFromMap:(GMSMapView *)map andGMSCameraPosition:(GMSCameraPosition *)position;
+ (GMSCameraPosition*)makeGMSCameraPositionFromMap:(GMSMapView *)map andMKCoordinateRegion:(MKCoordinateRegion)region;

- (NSDictionary*) getMarkersFramesWithOnlyVisible:(BOOL)onlyVisible;

@end

#endif
