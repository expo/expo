//
//  ABI20_0_0AIRGoogleMapManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//


#import "ABI20_0_0AIRGoogleMapManager.h"
#import <ReactABI20_0_0/ABI20_0_0RCTViewManager.h>
#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUIManager.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert+CoreLocation.h>
#import <ReactABI20_0_0/ABI20_0_0RCTEventDispatcher.h>
#import <ReactABI20_0_0/ABI20_0_0RCTViewManager.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>
#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>
#import "ABI20_0_0RCTConvert+GMSMapViewType.h"
#import "ABI20_0_0AIRGoogleMap.h"
#import "ABI20_0_0AIRMapMarker.h"
#import "ABI20_0_0AIRMapPolyline.h"
#import "ABI20_0_0AIRMapPolygon.h"
#import "ABI20_0_0AIRMapCircle.h"
#import "ABI20_0_0SMCalloutView.h"
#import "ABI20_0_0AIRGoogleMapMarker.h"
#import "ABI20_0_0RCTConvert+AirMap.h"

#import <MapKit/MapKit.h>
#import <QuartzCore/QuartzCore.h>

static NSString *const ABI20_0_0RCTMapViewKey = @"MapView";


@interface ABI20_0_0AIRGoogleMapManager() <GMSMapViewDelegate>

@end

@implementation ABI20_0_0AIRGoogleMapManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI20_0_0AIRGoogleMap *map = [ABI20_0_0AIRGoogleMap new];
  map.delegate = self;
  return map;
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(initialRegion, MKCoordinateRegion)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(region, MKCoordinateRegion)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(showsBuildings, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(showsCompass, BOOL)
//ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(showsScale, BOOL)  // Not supported by GoogleMaps
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(showsTraffic, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(zoomEnabled, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(rotateEnabled, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(pitchEnabled, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(showsUserLocation, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(showsMyLocationButton, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(customMapStyleString, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI20_0_0RCTBubblingEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onLongPress, ABI20_0_0RCTBubblingEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI20_0_0RCTBubblingEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onMarkerPress, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onRegionChange, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onRegionChangeComplete, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(mapType, GMSMapViewType)

ABI20_0_0RCT_EXPORT_METHOD(animateToRegion:(nonnull NSNumber *)ReactABI20_0_0Tag
                  withRegion:(MKCoordinateRegion)region
                  withDuration:(CGFloat)duration)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0AIRGoogleMap class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0AIRGoogleMap, got: %@", view);
    } else {
      // Core Animation must be used to control the animation's duration
      // See http://stackoverflow.com/a/15663039/171744
      [CATransaction begin];
      [CATransaction setAnimationDuration:duration/1000];
      ABI20_0_0AIRGoogleMap *mapView = (ABI20_0_0AIRGoogleMap *)view;
      GMSCameraPosition *camera = [ABI20_0_0AIRGoogleMap makeGMSCameraPositionFromMap:mapView andMKCoordinateRegion:region];
      [mapView animateToCameraPosition:camera];
      [CATransaction commit];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(animateToCoordinate:(nonnull NSNumber *)ReactABI20_0_0Tag
                  withRegion:(CLLocationCoordinate2D)latlng
                  withDuration:(CGFloat)duration)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0AIRGoogleMap class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0AIRGoogleMap, got: %@", view);
    } else {
      [CATransaction begin];
      [CATransaction setAnimationDuration:duration/1000];
      [(ABI20_0_0AIRGoogleMap *)view animateToLocation:latlng];
      [CATransaction commit];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(fitToElements:(nonnull NSNumber *)ReactABI20_0_0Tag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0AIRGoogleMap class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI20_0_0AIRGoogleMap *mapView = (ABI20_0_0AIRGoogleMap *)view;

      CLLocationCoordinate2D myLocation = ((ABI20_0_0AIRGoogleMapMarker *)(mapView.markers.firstObject)).realMarker.position;
      GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:myLocation coordinate:myLocation];

      for (ABI20_0_0AIRGoogleMapMarker *marker in mapView.markers)
        bounds = [bounds includingCoordinate:marker.realMarker.position];

      [mapView animateWithCameraUpdate:[GMSCameraUpdate fitBounds:bounds withPadding:55.0f]];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(fitToSuppliedMarkers:(nonnull NSNumber *)ReactABI20_0_0Tag
                  markers:(nonnull NSArray *)markers
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0AIRGoogleMap class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI20_0_0AIRGoogleMap *mapView = (ABI20_0_0AIRGoogleMap *)view;

      NSPredicate *filterMarkers = [NSPredicate predicateWithBlock:^BOOL(id evaluatedObject, NSDictionary *bindings) {
        ABI20_0_0AIRGoogleMapMarker *marker = (ABI20_0_0AIRGoogleMapMarker *)evaluatedObject;
        return [marker isKindOfClass:[ABI20_0_0AIRGoogleMapMarker class]] && [markers containsObject:marker.identifier];
      }];

      NSArray *filteredMarkers = [mapView.markers filteredArrayUsingPredicate:filterMarkers];

      CLLocationCoordinate2D myLocation = ((ABI20_0_0AIRGoogleMapMarker *)(filteredMarkers.firstObject)).realMarker.position;
      GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:myLocation coordinate:myLocation];

      for (ABI20_0_0AIRGoogleMapMarker *marker in filteredMarkers)
        bounds = [bounds includingCoordinate:marker.realMarker.position];

      [mapView animateWithCameraUpdate:[GMSCameraUpdate fitBounds:bounds withPadding:55.0f]];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(fitToCoordinates:(nonnull NSNumber *)ReactABI20_0_0Tag
                  coordinates:(nonnull NSArray<ABI20_0_0AIRMapCoordinate *> *)coordinates
                  edgePadding:(nonnull NSDictionary *)edgePadding
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0AIRGoogleMap class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI20_0_0AIRGoogleMap *mapView = (ABI20_0_0AIRGoogleMap *)view;

      CLLocationCoordinate2D myLocation = coordinates.firstObject.coordinate;
      GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:myLocation coordinate:myLocation];

      for (ABI20_0_0AIRMapCoordinate *coordinate in coordinates)
        bounds = [bounds includingCoordinate:coordinate.coordinate];

      // Set Map viewport
      CGFloat top = [ABI20_0_0RCTConvert CGFloat:edgePadding[@"top"]];
      CGFloat right = [ABI20_0_0RCTConvert CGFloat:edgePadding[@"right"]];
      CGFloat bottom = [ABI20_0_0RCTConvert CGFloat:edgePadding[@"bottom"]];
      CGFloat left = [ABI20_0_0RCTConvert CGFloat:edgePadding[@"left"]];

      [mapView animateWithCameraUpdate:[GMSCameraUpdate fitBounds:bounds withEdgeInsets:UIEdgeInsetsMake(top, left, bottom, right)]];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(takeSnapshot:(nonnull NSNumber *)ReactABI20_0_0Tag
                  withWidth:(nonnull NSNumber *)width
                  withHeight:(nonnull NSNumber *)height
                  withRegion:(MKCoordinateRegion)region
                  withCallback:(ABI20_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0AIRGoogleMap class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0AIRMap, got: %@", view);
    } else {
      ABI20_0_0AIRGoogleMap *mapView = (ABI20_0_0AIRGoogleMap *)view;

      // TODO: currently we are ignoring width, height, region

      UIGraphicsBeginImageContextWithOptions(mapView.frame.size, YES, 0.0f);
      [mapView.layer renderInContext:UIGraphicsGetCurrentContext()];
      UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
      UIGraphicsEndImageContext();

      NSTimeInterval timeStamp = [[NSDate date] timeIntervalSince1970];
      NSString *pathComponent = [NSString stringWithFormat:@"Documents/snapshot-%.20lf.png", timeStamp];
      NSString *filePath = [NSHomeDirectory() stringByAppendingPathComponent: pathComponent];

      NSData *data = UIImagePNGRepresentation(image);
      [data writeToFile:filePath atomically:YES];
      NSDictionary *snapshotData = @{
                                     @"uri": filePath,
                                     @"data": [data base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithCarriageReturn]
                                     };
      callback(@[[NSNull null], snapshotData]);
    }
  }];
}


- (BOOL)mapView:(GMSMapView *)mapView didTapMarker:(GMSMarker *)marker {
  ABI20_0_0AIRGoogleMap *googleMapView = (ABI20_0_0AIRGoogleMap *)mapView;
  return [googleMapView didTapMarker:marker];
}

- (void)mapView:(GMSMapView *)mapView didTapOverlay:(GMSPolygon *)polygon {
  ABI20_0_0AIRGoogleMap *googleMapView = (ABI20_0_0AIRGoogleMap *)mapView;
  [googleMapView didTapPolygon:polygon];
}

- (void)mapView:(GMSMapView *)mapView didTapAtCoordinate:(CLLocationCoordinate2D)coordinate {
  ABI20_0_0AIRGoogleMap *googleMapView = (ABI20_0_0AIRGoogleMap *)mapView;
  [googleMapView didTapAtCoordinate:coordinate];
}

- (void)mapView:(GMSMapView *)mapView didLongPressAtCoordinate:(CLLocationCoordinate2D)coordinate {
  ABI20_0_0AIRGoogleMap *googleMapView = (ABI20_0_0AIRGoogleMap *)mapView;
  [googleMapView didLongPressAtCoordinate:coordinate];
}

- (void)mapView:(GMSMapView *)mapView didChangeCameraPosition:(GMSCameraPosition *)position {
  ABI20_0_0AIRGoogleMap *googleMapView = (ABI20_0_0AIRGoogleMap *)mapView;
  [googleMapView didChangeCameraPosition:position];
}

- (void)mapView:(GMSMapView *)mapView idleAtCameraPosition:(GMSCameraPosition *)position {
  ABI20_0_0AIRGoogleMap *googleMapView = (ABI20_0_0AIRGoogleMap *)mapView;
  [googleMapView idleAtCameraPosition:position];
}

- (UIView *)mapView:(GMSMapView *)mapView markerInfoWindow:(GMSMarker *)marker {
  ABI20_0_0AIRGMSMarker *aMarker = (ABI20_0_0AIRGMSMarker *)marker;
  return [aMarker.fakeMarker markerInfoWindow];}

- (UIView *)mapView:(GMSMapView *)mapView markerInfoContents:(GMSMarker *)marker {
  ABI20_0_0AIRGMSMarker *aMarker = (ABI20_0_0AIRGMSMarker *)marker;
  return [aMarker.fakeMarker markerInfoContents];
}

- (void)mapView:(GMSMapView *)mapView didTapInfoWindowOfMarker:(GMSMarker *)marker {
  ABI20_0_0AIRGMSMarker *aMarker = (ABI20_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didTapInfoWindowOfMarker:aMarker];
}

- (void)mapView:(GMSMapView *)mapView didBeginDraggingMarker:(GMSMarker *)marker {
  ABI20_0_0AIRGMSMarker *aMarker = (ABI20_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didBeginDraggingMarker:aMarker];
}

- (void)mapView:(GMSMapView *)mapView didEndDraggingMarker:(GMSMarker *)marker {
  ABI20_0_0AIRGMSMarker *aMarker = (ABI20_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didEndDraggingMarker:aMarker];
}

- (void)mapView:(GMSMapView *)mapView didDragMarker:(GMSMarker *)marker {
  ABI20_0_0AIRGMSMarker *aMarker = (ABI20_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didDragMarker:aMarker];
}
@end
