//
//  ABI33_0_0AIRGoogleMapManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS


#import "ABI33_0_0AIRGoogleMapManager.h"
#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManager.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert+CoreLocation.h>
#import <ReactABI33_0_0/ABI33_0_0RCTEventDispatcher.h>
#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>
#import "ABI33_0_0RCTConvert+GMSMapViewType.h"
#import "ABI33_0_0AIRGoogleMap.h"
#import "ABI33_0_0AIRMapMarker.h"
#import "ABI33_0_0AIRMapPolyline.h"
#import "ABI33_0_0AIRMapPolygon.h"
#import "ABI33_0_0AIRMapCircle.h"
#import "ABI33_0_0SMCalloutView.h"
#import "ABI33_0_0AIRGoogleMapMarker.h"
#import "ABI33_0_0RCTConvert+AirMap.h"

#import <MapKit/MapKit.h>
#import <QuartzCore/QuartzCore.h>

static NSString *const ABI33_0_0RCTMapViewKey = @"MapView";


@interface ABI33_0_0AIRGoogleMapManager() <GMSMapViewDelegate, GMSIndoorDisplayDelegate>
{
  BOOL didCallOnMapReady;
}
@end

@implementation ABI33_0_0AIRGoogleMapManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0AIRGoogleMap *map = [ABI33_0_0AIRGoogleMap new];
  map.bridge = self.bridge;
  map.delegate = self;
  map.isAccessibilityElement = YES;
  map.accessibilityElementsHidden = NO;
  map.settings.consumesGesturesInView = NO;
  map.indoorDisplay.delegate = self;
  self.map = map;

  UIPanGestureRecognizer *drag = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handleMapDrag:)];
  [drag setMinimumNumberOfTouches:1];
  [drag setMaximumNumberOfTouches:1];
  [map addGestureRecognizer:drag];

  UIPinchGestureRecognizer *pinch = [[UIPinchGestureRecognizer alloc] initWithTarget:self action:@selector(handleMapDrag:)];
  [map addGestureRecognizer:pinch];

  return map;
}

ABI33_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(initialCamera, GMSCameraPosition)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(camera, cameraProp, GMSCameraPosition)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(initialRegion, MKCoordinateRegion)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(region, MKCoordinateRegion)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(showsBuildings, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(showsCompass, BOOL)
//ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(showsScale, BOOL)  // Not supported by GoogleMaps
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(showsTraffic, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(zoomEnabled, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(rotateEnabled, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(pitchEnabled, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(zoomTapEnabled, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(showsUserLocation, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(showsMyLocationButton, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(showsIndoors, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(showsIndoorLevelPicker, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(customMapStyleString, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(mapPadding, UIEdgeInsets)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(paddingAdjustmentBehavior, paddingAdjustmentBehaviorString, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onMapReady, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onKmlReady, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onLongPress, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onPanDrag, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onUserLocationChange, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onMarkerPress, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onRegionChange, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onRegionChangeComplete, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onPoiClick, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onIndoorLevelActivated, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onIndoorBuildingFocused, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(mapType, GMSMapViewType)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(minZoomLevel, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maxZoomLevel, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(kmlSrc, NSString)

ABI33_0_0RCT_EXPORT_METHOD(getCamera:(nonnull NSNumber *)ReactABI33_0_0Tag
                  resolver: (ABI33_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI33_0_0RCTPromiseRejectBlock)reject)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI33_0_0Tag];
        if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
            reject(@"Invalid argument", [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view], NULL);
        } else {
            ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;
            resolve(@{
                      @"center": @{
                              @"latitude": @(mapView.camera.target.latitude),
                              @"longitude": @(mapView.camera.target.longitude),
                              },
                      @"pitch": @(mapView.camera.viewingAngle),
                      @"heading": @(mapView.camera.bearing),
                      @"zoom": @(mapView.camera.zoom),
                    });
        }
    }];
}

ABI33_0_0RCT_EXPORT_METHOD(setCamera:(nonnull NSNumber *)ReactABI33_0_0Tag
                  camera:(id)json)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI33_0_0Tag];
        if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
            ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
        } else {
            ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;
            GMSCameraPosition *camera = [ABI33_0_0RCTConvert GMSCameraPositionWithDefaults:json existingCamera:[mapView camera]];
            [mapView setCamera:camera];
        }
    }];
}


ABI33_0_0RCT_EXPORT_METHOD(animateCamera:(nonnull NSNumber *)ReactABI33_0_0Tag
                  withCamera:(id)json
                  withDuration:(CGFloat)duration)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI33_0_0Tag];
        if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
            ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
        } else {
            [CATransaction begin];
            [CATransaction setAnimationDuration:duration/1000];
            ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;
            GMSCameraPosition *camera = [ABI33_0_0RCTConvert GMSCameraPositionWithDefaults:json existingCamera:[mapView camera]];
            [mapView animateToCameraPosition:camera];
            [CATransaction commit];
        }
    }];
}

ABI33_0_0RCT_EXPORT_METHOD(animateToNavigation:(nonnull NSNumber *)ReactABI33_0_0Tag
                  withRegion:(MKCoordinateRegion)region
                  withBearing:(CGFloat)bearing
                  withAngle:(double)angle
                  withDuration:(CGFloat)duration)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
      [CATransaction begin];
      [CATransaction setAnimationDuration:duration/1000];
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;
      GMSCameraPosition *camera = [ABI33_0_0AIRGoogleMap makeGMSCameraPositionFromMap:mapView andMKCoordinateRegion:region];
      [mapView animateToCameraPosition:camera];
      [mapView animateToViewingAngle:angle];
      [mapView animateToBearing:bearing];
      [CATransaction commit];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(animateToRegion:(nonnull NSNumber *)ReactABI33_0_0Tag
                  withRegion:(MKCoordinateRegion)region
                  withDuration:(CGFloat)duration)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
      // Core Animation must be used to control the animation's duration
      // See http://stackoverflow.com/a/15663039/171744
      [CATransaction begin];
      [CATransaction setAnimationDuration:duration/1000];
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;
      GMSCameraPosition *camera = [ABI33_0_0AIRGoogleMap makeGMSCameraPositionFromMap:mapView andMKCoordinateRegion:region];
      [mapView animateToCameraPosition:camera];
      [CATransaction commit];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(animateToCoordinate:(nonnull NSNumber *)ReactABI33_0_0Tag
                  withRegion:(CLLocationCoordinate2D)latlng
                  withDuration:(CGFloat)duration)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
      [CATransaction begin];
      [CATransaction setAnimationDuration:duration/1000];
      [(ABI33_0_0AIRGoogleMap *)view animateToLocation:latlng];
      [CATransaction commit];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(animateToViewingAngle:(nonnull NSNumber *)ReactABI33_0_0Tag
                  withAngle:(double)angle
                  withDuration:(CGFloat)duration)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
      [CATransaction begin];
      [CATransaction setAnimationDuration:duration/1000];
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;
      [mapView animateToViewingAngle:angle];
      [CATransaction commit];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(animateToBearing:(nonnull NSNumber *)ReactABI33_0_0Tag
                  withBearing:(CGFloat)bearing
                  withDuration:(CGFloat)duration)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
      [CATransaction begin];
      [CATransaction setAnimationDuration:duration/1000];
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;
      [mapView animateToBearing:bearing];
      [CATransaction commit];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(fitToElements:(nonnull NSNumber *)ReactABI33_0_0Tag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;

      CLLocationCoordinate2D myLocation = ((ABI33_0_0AIRGoogleMapMarker *)(mapView.markers.firstObject)).realMarker.position;
      GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:myLocation coordinate:myLocation];

      for (ABI33_0_0AIRGoogleMapMarker *marker in mapView.markers)
        bounds = [bounds includingCoordinate:marker.realMarker.position];

      GMSCameraUpdate *cameraUpdate = [GMSCameraUpdate fitBounds:bounds withPadding:55.0f];

      if (animated) {
        [mapView animateWithCameraUpdate: cameraUpdate];
      } else {
        [mapView moveCamera: cameraUpdate];
      }
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(fitToSuppliedMarkers:(nonnull NSNumber *)ReactABI33_0_0Tag
                  markers:(nonnull NSArray *)markers
                  edgePadding:(nonnull NSDictionary *)edgePadding
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;

      NSPredicate *filterMarkers = [NSPredicate predicateWithBlock:^BOOL(id evaluatedObject, NSDictionary *bindings) {
        ABI33_0_0AIRGoogleMapMarker *marker = (ABI33_0_0AIRGoogleMapMarker *)evaluatedObject;
        return [marker isKindOfClass:[ABI33_0_0AIRGoogleMapMarker class]] && [markers containsObject:marker.identifier];
      }];

      NSArray *filteredMarkers = [mapView.markers filteredArrayUsingPredicate:filterMarkers];

      CLLocationCoordinate2D myLocation = ((ABI33_0_0AIRGoogleMapMarker *)(filteredMarkers.firstObject)).realMarker.position;
      GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:myLocation coordinate:myLocation];

      for (ABI33_0_0AIRGoogleMapMarker *marker in filteredMarkers)
        bounds = [bounds includingCoordinate:marker.realMarker.position];

      // Set Map viewport
      CGFloat top = [ABI33_0_0RCTConvert CGFloat:edgePadding[@"top"]];
      CGFloat right = [ABI33_0_0RCTConvert CGFloat:edgePadding[@"right"]];
      CGFloat bottom = [ABI33_0_0RCTConvert CGFloat:edgePadding[@"bottom"]];
      CGFloat left = [ABI33_0_0RCTConvert CGFloat:edgePadding[@"left"]];

      GMSCameraUpdate* cameraUpdate = [GMSCameraUpdate fitBounds:bounds withEdgeInsets:UIEdgeInsetsMake(top, left, bottom, right)];
      if (animated) {
        [mapView animateWithCameraUpdate:cameraUpdate
         ];
      } else {
        [mapView moveCamera: cameraUpdate];
      }
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(fitToCoordinates:(nonnull NSNumber *)ReactABI33_0_0Tag
                  coordinates:(nonnull NSArray<ABI33_0_0AIRMapCoordinate *> *)coordinates
                  edgePadding:(nonnull NSDictionary *)edgePadding
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;

      CLLocationCoordinate2D myLocation = coordinates.firstObject.coordinate;
      GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:myLocation coordinate:myLocation];

      for (ABI33_0_0AIRMapCoordinate *coordinate in coordinates)
        bounds = [bounds includingCoordinate:coordinate.coordinate];

      // Set Map viewport
      CGFloat top = [ABI33_0_0RCTConvert CGFloat:edgePadding[@"top"]];
      CGFloat right = [ABI33_0_0RCTConvert CGFloat:edgePadding[@"right"]];
      CGFloat bottom = [ABI33_0_0RCTConvert CGFloat:edgePadding[@"bottom"]];
      CGFloat left = [ABI33_0_0RCTConvert CGFloat:edgePadding[@"left"]];

      GMSCameraUpdate *cameraUpdate = [GMSCameraUpdate fitBounds:bounds withEdgeInsets:UIEdgeInsetsMake(top, left, bottom, right)];

      if (animated) {
        [mapView animateWithCameraUpdate: cameraUpdate];
      } else {
        [mapView moveCamera: cameraUpdate];
      }
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(takeSnapshot:(nonnull NSNumber *)ReactABI33_0_0Tag
                  withWidth:(nonnull NSNumber *)width
                  withHeight:(nonnull NSNumber *)height
                  withRegion:(MKCoordinateRegion)region
                  format:(nonnull NSString *)format
                  quality:(nonnull NSNumber *)quality
                  result:(nonnull NSString *)result
                  withCallback:(ABI33_0_0RCTResponseSenderBlock)callback)
{
  NSTimeInterval timeStamp = [[NSDate date] timeIntervalSince1970];
  NSString *pathComponent = [NSString stringWithFormat:@"Documents/snapshot-%.20lf.%@", timeStamp, format];
  NSString *filePath = [NSHomeDirectory() stringByAppendingPathComponent: pathComponent];

  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
        ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
    } else {
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;

      // TODO: currently we are ignoring width, height, region

      UIGraphicsBeginImageContextWithOptions(mapView.frame.size, YES, 0.0f);
      [mapView.layer renderInContext:UIGraphicsGetCurrentContext()];
      UIImage *image = UIGraphicsGetImageFromCurrentImageContext();

      NSData *data;
      if ([format isEqualToString:@"png"]) {
          data = UIImagePNGRepresentation(image);

      }
      else if([format isEqualToString:@"jpg"]) {
            data = UIImageJPEGRepresentation(image, quality.floatValue);
      }

      if ([result isEqualToString:@"file"]) {
          [data writeToFile:filePath atomically:YES];
            callback(@[[NSNull null], filePath]);
        }
        else if ([result isEqualToString:@"base64"]) {
            callback(@[[NSNull null], [data base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithCarriageReturn]]);
        }
        else if ([result isEqualToString:@"legacy"]) {

            // In the initial (iOS only) implementation of takeSnapshot,
            // both the uri and the base64 encoded string were returned.
            // Returning both is rarely useful and in fact causes a
            // performance penalty when only the file URI is desired.
            // In that case the base64 encoded string was always marshalled
            // over the JS-bridge (which is quite slow).
            // A new more flexible API was created to cover this.
            // This code should be removed in a future release when the
            // old API is fully deprecated.
            [data writeToFile:filePath atomically:YES];
            NSDictionary *snapshotData = @{
                                           @"uri": filePath,
                                           @"data": [data base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithCarriageReturn]
                                           };
            callback(@[[NSNull null], snapshotData]);
        }

    }
    UIGraphicsEndImageContext();
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(pointForCoordinate:(nonnull NSNumber *)ReactABI33_0_0Tag
                  coordinate:(NSDictionary *)coordinate
                  resolver: (ABI33_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI33_0_0RCTPromiseRejectBlock)reject)
{
  CLLocationCoordinate2D coord =
  CLLocationCoordinate2DMake(
                             [coordinate[@"latitude"] doubleValue],
                             [coordinate[@"longitude"] doubleValue]
                             );

  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
    } else {
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;

      CGPoint touchPoint = [mapView.projection pointForCoordinate:coord];

      resolve(@{
                @"x": @(touchPoint.x),
                @"y": @(touchPoint.y),
                });
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(coordinateForPoint:(nonnull NSNumber *)ReactABI33_0_0Tag
                  point:(NSDictionary *)point
                  resolver: (ABI33_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI33_0_0RCTPromiseRejectBlock)reject)
{
  CGPoint pt = CGPointMake(
                           [point[@"x"] doubleValue],
                           [point[@"y"] doubleValue]
                           );

  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
    } else {
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;

      CLLocationCoordinate2D coordinate = [mapView.projection coordinateForPoint:pt];

      resolve(@{
                @"latitude": @(coordinate.latitude),
                @"longitude": @(coordinate.longitude),
                });
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(getMarkersFrames:(nonnull NSNumber *)ReactABI33_0_0Tag
                  onlyVisible:(BOOL)onlyVisible
                  resolver: (ABI33_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI33_0_0RCTPromiseRejectBlock)reject)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI33_0_0Tag];
        if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
            ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
        } else {
            ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;
            resolve([mapView getMarkersFramesWithOnlyVisible:onlyVisible]);
        }
    }];
}

ABI33_0_0RCT_EXPORT_METHOD(getMapBoundaries:(nonnull NSNumber *)ReactABI33_0_0Tag
                  resolver:(ABI33_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI33_0_0RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
        NSArray *boundingBox = [view getMapBoundaries];

        resolve(@{
          @"northEast" : @{
            @"longitude" : boundingBox[0][0],
            @"latitude" : boundingBox[0][1]
          },
          @"southWest" : @{
            @"longitude" : boundingBox[1][0],
            @"latitude" : boundingBox[1][1]
          }
        });
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(setMapBoundaries:(nonnull NSNumber *)ReactABI33_0_0Tag
                  northEast:(CLLocationCoordinate2D)northEast
                  southWest:(CLLocationCoordinate2D)southWest)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;

      GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithCoordinate:northEast coordinate:southWest];

      mapView.cameraTargetBounds = bounds;
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(setIndoorActiveLevelIndex:(nonnull NSNumber *)ReactABI33_0_0Tag
                  levelIndex:(NSInteger) levelIndex)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMap class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRGoogleMap, got: %@", view);
    } else {
      ABI33_0_0AIRGoogleMap *mapView = (ABI33_0_0AIRGoogleMap *)view;
      if (!self.map.indoorDisplay) {
        return;
      }
      if ( levelIndex < [self.map.indoorDisplay.activeBuilding.levels count]) {
        mapView.indoorDisplay.activeLevel = self.map.indoorDisplay.activeBuilding.levels[levelIndex];
      }
    }
  }];
 }

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (NSDictionary *)constantsToExport {
  return @{ @"legalNotice": [GMSServices openSourceLicenseInfo] };
}

- (void)mapViewDidStartTileRendering:(GMSMapView *)mapView {
  ABI33_0_0AIRGoogleMap *googleMapView = (ABI33_0_0AIRGoogleMap *)mapView;
  [googleMapView didPrepareMap];
}

- (BOOL)mapView:(GMSMapView *)mapView didTapMarker:(GMSMarker *)marker {
  ABI33_0_0AIRGoogleMap *googleMapView = (ABI33_0_0AIRGoogleMap *)mapView;
  return [googleMapView didTapMarker:marker];
}

- (void)mapView:(GMSMapView *)mapView didTapOverlay:(GMSPolygon *)polygon {
  ABI33_0_0AIRGoogleMap *googleMapView = (ABI33_0_0AIRGoogleMap *)mapView;
  [googleMapView didTapPolygon:polygon];
}

- (void)mapView:(GMSMapView *)mapView didTapAtCoordinate:(CLLocationCoordinate2D)coordinate {
  ABI33_0_0AIRGoogleMap *googleMapView = (ABI33_0_0AIRGoogleMap *)mapView;
  [googleMapView didTapAtCoordinate:coordinate];
}

- (void)mapView:(GMSMapView *)mapView didLongPressAtCoordinate:(CLLocationCoordinate2D)coordinate {
  ABI33_0_0AIRGoogleMap *googleMapView = (ABI33_0_0AIRGoogleMap *)mapView;
  [googleMapView didLongPressAtCoordinate:coordinate];
}

- (void)mapView:(GMSMapView *)mapView didChangeCameraPosition:(GMSCameraPosition *)position {
  ABI33_0_0AIRGoogleMap *googleMapView = (ABI33_0_0AIRGoogleMap *)mapView;
  [googleMapView didChangeCameraPosition:position];
}

- (void)mapView:(GMSMapView *)mapView idleAtCameraPosition:(GMSCameraPosition *)position {
  ABI33_0_0AIRGoogleMap *googleMapView = (ABI33_0_0AIRGoogleMap *)mapView;
  [googleMapView idleAtCameraPosition:position];
}

- (UIView *)mapView:(GMSMapView *)mapView markerInfoWindow:(GMSMarker *)marker {
  ABI33_0_0AIRGMSMarker *aMarker = (ABI33_0_0AIRGMSMarker *)marker;
  return [aMarker.fakeMarker markerInfoWindow];}

- (UIView *)mapView:(GMSMapView *)mapView markerInfoContents:(GMSMarker *)marker {
  ABI33_0_0AIRGMSMarker *aMarker = (ABI33_0_0AIRGMSMarker *)marker;
  return [aMarker.fakeMarker markerInfoContents];
}

- (void)mapView:(GMSMapView *)mapView didTapInfoWindowOfMarker:(GMSMarker *)marker {
  ABI33_0_0AIRGMSMarker *aMarker = (ABI33_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didTapInfoWindowOfMarker:aMarker];
}

- (void)mapView:(GMSMapView *)mapView didBeginDraggingMarker:(GMSMarker *)marker {
  ABI33_0_0AIRGMSMarker *aMarker = (ABI33_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didBeginDraggingMarker:aMarker];
}

- (void)mapView:(GMSMapView *)mapView didEndDraggingMarker:(GMSMarker *)marker {
  ABI33_0_0AIRGMSMarker *aMarker = (ABI33_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didEndDraggingMarker:aMarker];
}

- (void)mapView:(GMSMapView *)mapView didDragMarker:(GMSMarker *)marker {
  ABI33_0_0AIRGMSMarker *aMarker = (ABI33_0_0AIRGMSMarker *)marker;
  [aMarker.fakeMarker didDragMarker:aMarker];
}

- (void) didChangeActiveBuilding: (nullable GMSIndoorBuilding *) building {
  if (!building) {
    if (!self.map.onIndoorBuildingFocused) {
      return;
    }
    self.map.onIndoorBuildingFocused(@{
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
                            }
    ];
    i++;
  }
  if (!self.map.onIndoorBuildingFocused) {
    return;
  }
  self.map.onIndoorBuildingFocused(@{
                                    @"IndoorBuilding": @{
                                        @"activeLevelIndex": @(building.defaultLevelIndex),
                                        @"underground": @(building.underground),
                                        @"levels": arrayLevels
                                    }
                                  }
  );
}

- (void) didChangeActiveLevel: (nullable GMSIndoorLevel *) 	level {
  if (!self.map.onIndoorLevelActivated || !self.map.indoorDisplay  || !level) {
    return;
  }
  NSInteger i = 0;
  for (GMSIndoorLevel *buildingLevel in self.map.indoorDisplay.activeBuilding.levels) {
    if (buildingLevel.name == level.name && buildingLevel.shortName == level.shortName) {
      break;
    }
    i++;
  }
  self.map.onIndoorLevelActivated(@{
                                  @"IndoorLevel": @{
                                    @"activeLevelIndex": @(i),
                                    @"name": level.name,
                                    @"shortName": level.shortName
                                  }
  });
}

- (void)mapView:(GMSMapView *)mapView
    didTapPOIWithPlaceID:(NSString *)placeID
                    name:(NSString *)name
                location:(CLLocationCoordinate2D)location {
    ABI33_0_0AIRGoogleMap *googleMapView = (ABI33_0_0AIRGoogleMap *)mapView;
    [googleMapView didTapPOIWithPlaceID:placeID name:name location:location];
}

#pragma mark Gesture Recognizer Handlers

- (void)handleMapDrag:(UIPanGestureRecognizer*)recognizer {
  ABI33_0_0AIRGoogleMap *map = (ABI33_0_0AIRGoogleMap *)recognizer.view;
  if (!map.onPanDrag) return;

  CGPoint touchPoint = [recognizer locationInView:map];
  CLLocationCoordinate2D coord = [map.projection coordinateForPoint:touchPoint];
  map.onPanDrag(@{
                  @"coordinate": @{
                      @"latitude": @(coord.latitude),
                      @"longitude": @(coord.longitude),
                      },
                  @"position": @{
                      @"x": @(touchPoint.x),
                      @"y": @(touchPoint.y),
                      },
                  });

}

@end

#endif
