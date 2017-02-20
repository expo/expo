//
//  ABI14_0_0AIRGoogleMapManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//


#import "ABI14_0_0AIRGoogleMapManager.h"
#import <ReactABI14_0_0/ABI14_0_0RCTViewManager.h>
#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import <ReactABI14_0_0/ABI14_0_0RCTUIManager.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert+CoreLocation.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert+MapKit.h>
#import <ReactABI14_0_0/ABI14_0_0RCTEventDispatcher.h>
#import <ReactABI14_0_0/ABI14_0_0RCTViewManager.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import <ReactABI14_0_0/UIView+ReactABI14_0_0.h>
#import "ABI14_0_0RCTConvert+GMSMapViewType.h"
#import "ABI14_0_0AIRGoogleMap.h"
#import "ABI14_0_0AIRMapMarker.h"
#import "ABI14_0_0AIRMapPolyline.h"
#import "ABI14_0_0AIRMapPolygon.h"
#import "ABI14_0_0AIRMapCircle.h"
#import "ABI14_0_0SMCalloutView.h"
#import "ABI14_0_0AIRGoogleMapMarker.h"

#import <MapKit/MapKit.h>

static NSString *const ABI14_0_0RCTMapViewKey = @"MapView";


@interface ABI14_0_0AIRGoogleMapManager() <GMSMapViewDelegate>

@end

@implementation ABI14_0_0AIRGoogleMapManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI14_0_0AIRGoogleMap *map = [ABI14_0_0AIRGoogleMap new];
  map.delegate = self;
  return map;
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(initialRegion, MKCoordinateRegion)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(region, MKCoordinateRegion)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(showsBuildings, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(showsCompass, BOOL)
//ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(showsScale, BOOL)  // Not supported by GoogleMaps
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(showsTraffic, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(zoomEnabled, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(rotateEnabled, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(pitchEnabled, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(showsUserLocation, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(customMapStyleString, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI14_0_0RCTBubblingEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onLongPress, ABI14_0_0RCTBubblingEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI14_0_0RCTBubblingEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onMarkerPress, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onRegionChange, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onRegionChangeComplete, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(mapType, GMSMapViewType)

ABI14_0_0RCT_EXPORT_METHOD(animateToRegion:(nonnull NSNumber *)ReactABI14_0_0Tag
                  withRegion:(MKCoordinateRegion)region
                  withDuration:(CGFloat)duration)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI14_0_0Tag];
    if (![view isKindOfClass:[ABI14_0_0AIRGoogleMap class]]) {
      ABI14_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI14_0_0AIRGoogleMap, got: %@", view);
    } else {
      [ABI14_0_0AIRGoogleMap animateWithDuration:duration/1000 animations:^{
        GMSCameraPosition* camera = [ABI14_0_0AIRGoogleMap makeGMSCameraPositionFromMap:(ABI14_0_0AIRGoogleMap *)view andMKCoordinateRegion:region];
        [(ABI14_0_0AIRGoogleMap *)view animateToCameraPosition:camera];
      }];
    }
  }];
}

ABI14_0_0RCT_EXPORT_METHOD(fitToElements:(nonnull NSNumber *)ReactABI14_0_0Tag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI14_0_0Tag];
    if (![view isKindOfClass:[ABI14_0_0AIRGoogleMap class]]) {
      ABI14_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI14_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI14_0_0AIRGoogleMap *mapView = (ABI14_0_0AIRGoogleMap *)view;

      CLLocationCoordinate2D myLocation = ((ABI14_0_0AIRGoogleMapMarker *)(mapView.markers.firstObject)).realMarker.position;
      GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:myLocation coordinate:myLocation];

      for (ABI14_0_0AIRGoogleMapMarker *marker in mapView.markers)
        bounds = [bounds includingCoordinate:marker.realMarker.position];

      [mapView animateWithCameraUpdate:[GMSCameraUpdate fitBounds:bounds withPadding:55.0f]];
    }
  }];
}

ABI14_0_0RCT_EXPORT_METHOD(fitToSuppliedMarkers:(nonnull NSNumber *)ReactABI14_0_0Tag
                  markers:(nonnull NSArray *)markers
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI14_0_0Tag];
    if (![view isKindOfClass:[ABI14_0_0AIRGoogleMap class]]) {
      ABI14_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI14_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI14_0_0AIRGoogleMap *mapView = (ABI14_0_0AIRGoogleMap *)view;

      NSPredicate *filterMarkers = [NSPredicate predicateWithBlock:^BOOL(id evaluatedObject, NSDictionary *bindings) {
        ABI14_0_0AIRGoogleMapMarker *marker = (ABI14_0_0AIRGoogleMapMarker *)evaluatedObject;
        return [marker isKindOfClass:[ABI14_0_0AIRGoogleMapMarker class]] && [markers containsObject:marker.identifier];
      }];

      NSArray *filteredMarkers = [mapView.markers filteredArrayUsingPredicate:filterMarkers];

      CLLocationCoordinate2D myLocation = ((ABI14_0_0AIRGoogleMapMarker *)(filteredMarkers.firstObject)).realMarker.position;
      GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:myLocation coordinate:myLocation];

      for (ABI14_0_0AIRGoogleMapMarker *marker in filteredMarkers)
        bounds = [bounds includingCoordinate:marker.realMarker.position];

      [mapView animateWithCameraUpdate:[GMSCameraUpdate fitBounds:bounds withPadding:55.0f]];
    }
  }];
}

ABI14_0_0RCT_EXPORT_METHOD(fitToCoordinates:(nonnull NSNumber *)ReactABI14_0_0Tag
                  coordinates:(nonnull NSArray<ABI14_0_0AIRMapCoordinate *> *)coordinates
                  edgePadding:(nonnull NSDictionary *)edgePadding
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI14_0_0Tag];
    if (![view isKindOfClass:[ABI14_0_0AIRGoogleMap class]]) {
      ABI14_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI14_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI14_0_0AIRGoogleMap *mapView = (ABI14_0_0AIRGoogleMap *)view;

      CLLocationCoordinate2D myLocation = coordinates.firstObject.coordinate;
      GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:myLocation coordinate:myLocation];

      for (ABI14_0_0AIRMapCoordinate *coordinate in coordinates)
        bounds = [bounds includingCoordinate:coordinate.coordinate];

      // Set Map viewport
      CGFloat top = [ABI14_0_0RCTConvert CGFloat:edgePadding[@"top"]];
      CGFloat right = [ABI14_0_0RCTConvert CGFloat:edgePadding[@"right"]];
      CGFloat bottom = [ABI14_0_0RCTConvert CGFloat:edgePadding[@"bottom"]];
      CGFloat left = [ABI14_0_0RCTConvert CGFloat:edgePadding[@"left"]];

      [mapView animateWithCameraUpdate:[GMSCameraUpdate fitBounds:bounds withEdgeInsets:UIEdgeInsetsMake(top, left, bottom, right)]];
    }
  }];
}

ABI14_0_0RCT_EXPORT_METHOD(takeSnapshot:(nonnull NSNumber *)ReactABI14_0_0Tag
                  withWidth:(nonnull NSNumber *)width
                  withHeight:(nonnull NSNumber *)height
                  withRegion:(MKCoordinateRegion)region
                  withCallback:(ABI14_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI14_0_0Tag];
    if (![view isKindOfClass:[ABI14_0_0AIRGoogleMap class]]) {
      ABI14_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI14_0_0AIRMap, got: %@", view);
    } else {
      ABI14_0_0AIRGoogleMap *mapView = (ABI14_0_0AIRGoogleMap *)view;

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
  ABI14_0_0AIRGoogleMap *googleMapView = (ABI14_0_0AIRGoogleMap *)mapView;
  return [googleMapView didTapMarker:marker];
}

- (void)mapView:(GMSMapView *)mapView didTapAtCoordinate:(CLLocationCoordinate2D)coordinate {
  ABI14_0_0AIRGoogleMap *googleMapView = (ABI14_0_0AIRGoogleMap *)mapView;
  [googleMapView didTapAtCoordinate:coordinate];
}

- (void)mapView:(GMSMapView *)mapView didLongPressAtCoordinate:(CLLocationCoordinate2D)coordinate {
  ABI14_0_0AIRGoogleMap *googleMapView = (ABI14_0_0AIRGoogleMap *)mapView;
  [googleMapView didLongPressAtCoordinate:coordinate];
}

- (void)mapView:(GMSMapView *)mapView didChangeCameraPosition:(GMSCameraPosition *)position {
  ABI14_0_0AIRGoogleMap *googleMapView = (ABI14_0_0AIRGoogleMap *)mapView;
  [googleMapView didChangeCameraPosition:position];
}

- (void)mapView:(GMSMapView *)mapView idleAtCameraPosition:(GMSCameraPosition *)position {
  ABI14_0_0AIRGoogleMap *googleMapView = (ABI14_0_0AIRGoogleMap *)mapView;
  [googleMapView idleAtCameraPosition:position];
}

- (UIView *)mapView:(GMSMapView *)mapView markerInfoWindow:(GMSMarker *)marker {
  ABI14_0_0AIRGMSMarker *aMarker = (ABI14_0_0AIRGMSMarker *)marker;
  return [aMarker.fakeMarker markerInfoWindow];}

- (UIView *)mapView:(GMSMapView *)mapView markerInfoContents:(GMSMarker *)marker {
  ABI14_0_0AIRGMSMarker *aMarker = (ABI14_0_0AIRGMSMarker *)marker;
  return [aMarker.fakeMarker markerInfoContents];
}

- (void)mapView:(GMSMapView *)mapView didTapInfoWindowOfMarker:(GMSMarker *)marker {
  ABI14_0_0AIRGMSMarker *aMarker = (ABI14_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didTapInfoWindowOfMarker:aMarker];
}

- (void)mapView:(GMSMapView *)mapView didBeginDraggingMarker:(GMSMarker *)marker {
  ABI14_0_0AIRGMSMarker *aMarker = (ABI14_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didBeginDraggingMarker:aMarker];
}

- (void)mapView:(GMSMapView *)mapView didEndDraggingMarker:(GMSMarker *)marker {
  ABI14_0_0AIRGMSMarker *aMarker = (ABI14_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didEndDraggingMarker:aMarker];
}

- (void)mapView:(GMSMapView *)mapView didDragMarker:(GMSMarker *)marker {
  ABI14_0_0AIRGMSMarker *aMarker = (ABI14_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didDragMarker:aMarker];
}
@end
