//
//  ABI49_0_0AIRGoogleMap.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI49_0_0HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>
#import <ABI49_0_0React/ABI49_0_0RCTComponent.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <GoogleMaps/GoogleMaps.h>
#import <MapKit/MapKit.h>
#import "ABI49_0_0AIRGMSMarker.h"
#import "ABI49_0_0RCTConvert+AirMap.h"

@interface ABI49_0_0AIRGoogleMap : GMSMapView

// TODO: don't use MK region?
@property (nonatomic, weak) ABI49_0_0RCTBridge *bridge;
@property (nonatomic, assign) MKCoordinateRegion initialRegion;
@property (nonatomic, assign) MKCoordinateRegion region;
@property (nonatomic, assign) GMSCameraPosition *cameraProp;   // Because the base class already has a "camera" prop.
@property (nonatomic, strong) GMSCameraPosition *initialCamera;
@property (nonatomic, assign) NSString *customMapStyleString;
@property (nonatomic, assign) UIEdgeInsets mapPadding;
@property (nonatomic, assign) NSString *paddingAdjustmentBehaviorString;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onMapReady;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onMapLoaded;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onKmlReady;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onPress;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onLongPress;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onPanDrag;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onUserLocationChange;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onMarkerPress;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onChange;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onPoiClick;
@property (nonatomic, copy) ABI49_0_0RCTDirectEventBlock onRegionChange;
@property (nonatomic, copy) ABI49_0_0RCTDirectEventBlock onRegionChangeComplete;
@property (nonatomic, copy) ABI49_0_0RCTDirectEventBlock onIndoorLevelActivated;
@property (nonatomic, copy) ABI49_0_0RCTDirectEventBlock onIndoorBuildingFocused;
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
@property (nonatomic, assign) BOOL scrollDuringRotateOrZoomEnabled;
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
