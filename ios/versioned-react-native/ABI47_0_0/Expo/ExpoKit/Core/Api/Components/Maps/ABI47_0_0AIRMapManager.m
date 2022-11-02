/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI47_0_0AIRMapManager.h"

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert+CoreLocation.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcher.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>
#import "ABI47_0_0AIRMap.h"
#import "ABI47_0_0AIRMapMarker.h"
#import "ABI47_0_0AIRMapPolyline.h"
#import "ABI47_0_0AIRMapPolygon.h"
#import "ABI47_0_0AIRMapCircle.h"
#import "ABI47_0_0SMCalloutView.h"
#import "ABI47_0_0AIRMapUrlTile.h"
#import "ABI47_0_0AIRMapWMSTile.h"
#import "ABI47_0_0AIRMapLocalTile.h"
#import "ABI47_0_0AIRMapSnapshot.h"
#import "ABI47_0_0RCTConvert+AirMap.h"
#import "ABI47_0_0AIRMapOverlay.h"
#import <MapKit/MapKit.h>

static NSString *const ABI47_0_0RCTMapViewKey = @"MapView";


@interface ABI47_0_0AIRMapManager() <MKMapViewDelegate, UIGestureRecognizerDelegate>

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer;

@end

@implementation ABI47_0_0AIRMapManager{
   BOOL _hasObserver;
}

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI47_0_0AIRMap *map = [ABI47_0_0AIRMap new];
    map.delegate = self;

    map.isAccessibilityElement = NO;
    map.accessibilityElementsHidden = NO;
    
    // MKMapView doesn't report tap events, so we attach gesture recognizers to it
    UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleMapTap:)];
    UITapGestureRecognizer *doubleTap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleMapDoubleTap:)];
    [doubleTap setNumberOfTapsRequired:2];
    [tap requireGestureRecognizerToFail:doubleTap];
    
    UILongPressGestureRecognizer *longPress = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(handleMapLongPress:)];
    UIPanGestureRecognizer *drag = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handleMapDrag:)];
    [drag setMinimumNumberOfTouches:1];
    // setting this to NO allows the parent MapView to continue receiving marker selection events
    tap.cancelsTouchesInView = NO;
    doubleTap.cancelsTouchesInView = NO;
    longPress.cancelsTouchesInView = NO;
    
    doubleTap.delegate = self;
    
    // disable drag by default
    drag.enabled = NO;
    drag.delegate = self;
  
    [map addGestureRecognizer:tap];
    [map addGestureRecognizer:doubleTap];
    [map addGestureRecognizer:longPress];
    [map addGestureRecognizer:drag];

    return map;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(isAccessibilityElement, BOOL)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(showsUserLocation, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(userLocationAnnotationTitle, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(userInterfaceStyle, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(followsUserLocation, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(userLocationCalloutEnabled, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(showsPointsOfInterest, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(showsBuildings, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(showsCompass, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(showsScale, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(showsTraffic, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(zoomEnabled, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(kmlSrc, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(rotateEnabled, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(pitchEnabled, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(cacheEnabled, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(loadingEnabled, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(loadingBackgroundColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(loadingIndicatorColor, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(handlePanDrag, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maxDelta, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minDelta, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(compassOffset, CGPoint)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(legalLabelInsets, UIEdgeInsets)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(mapPadding, UIEdgeInsets)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(mapType, MKMapType)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onMapReady, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPanDrag, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onLongPress, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onDoublePress, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onMarkerPress, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onMarkerSelect, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onMarkerDeselect, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onMarkerDragStart, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onMarkerDrag, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onMarkerDragEnd, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onUserLocationChange, ABI47_0_0RCTBubblingEventBlock)
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(initialRegion, MKCoordinateRegion, ABI47_0_0AIRMap)
{
    if (json == nil) return;

    // don't emit region change events when we are setting the initialRegion
    BOOL originalIgnore = view.ignoreRegionChanges;
    view.ignoreRegionChanges = YES;
    [view setInitialRegion:[ABI47_0_0RCTConvert MKCoordinateRegion:json]];
    view.ignoreRegionChanges = originalIgnore;
}
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(initialCamera, MKMapCamera, ABI47_0_0AIRMap)
{
    if (json == nil) return;
    
    // don't emit region change events when we are setting the initialCamera
    BOOL originalIgnore = view.ignoreRegionChanges;
    view.ignoreRegionChanges = YES;
    [view setInitialCamera:[ABI47_0_0RCTConvert MKMapCamera:json]];
    view.ignoreRegionChanges = originalIgnore;
}


ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minZoomLevel, CGFloat)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maxZoomLevel, CGFloat)


ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(region, MKCoordinateRegion, ABI47_0_0AIRMap)
{
    if (json == nil) return;

    // don't emit region change events when we are setting the region
    BOOL originalIgnore = view.ignoreRegionChanges;
    view.ignoreRegionChanges = YES;
    [view setRegion:[ABI47_0_0RCTConvert MKCoordinateRegion:json] animated:NO];
    view.ignoreRegionChanges = originalIgnore;
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(camera, MKMapCamera*, ABI47_0_0AIRMap)
{
    if (json == nil) return;
    
    // don't emit region change events when we are setting the camera
    BOOL originalIgnore = view.ignoreRegionChanges;
    view.ignoreRegionChanges = YES;
    [view setCamera:[ABI47_0_0RCTConvert MKMapCamera:json] animated:NO];
    view.ignoreRegionChanges = originalIgnore;
}


#pragma mark exported MapView methods

ABI47_0_0RCT_EXPORT_METHOD(getMapBoundaries:(nonnull NSNumber *)ABI47_0_0ReactTag
                  resolver:(ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI47_0_0RCTPromiseRejectBlock)reject)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
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



ABI47_0_0RCT_EXPORT_METHOD(getCamera:(nonnull NSNumber *)ABI47_0_0ReactTag
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI47_0_0RCTPromiseRejectBlock)reject)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        ABI47_0_0AIRMap *mapView = (ABI47_0_0AIRMap *)view;
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            reject(@"Invalid argument", [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view], NULL);
        } else {
            MKMapCamera *camera = [mapView camera];
            resolve(@{
                      @"center": @{
                              @"latitude": @(camera.centerCoordinate.latitude),
                              @"longitude": @(camera.centerCoordinate.longitude),
                      },
                      @"pitch": @(camera.pitch),
                      @"heading": @(camera.heading),
                      @"altitude": @(camera.altitude),
            });
        }
    }];
}


ABI47_0_0RCT_EXPORT_METHOD(setCamera:(nonnull NSNumber *)ABI47_0_0ReactTag
                  camera:(id)json)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
        } else {
            ABI47_0_0AIRMap *mapView = (ABI47_0_0AIRMap *)view;

            // Merge the changes given with the current camera
            MKMapCamera *camera = [ABI47_0_0RCTConvert MKMapCameraWithDefaults:json existingCamera:[mapView camera]];

            // don't emit region change events when we are setting the camera
            BOOL originalIgnore = mapView.ignoreRegionChanges;
            mapView.ignoreRegionChanges = YES;
            [mapView setCamera:camera animated:NO];
            mapView.ignoreRegionChanges = originalIgnore;
        }
    }];
}


ABI47_0_0RCT_EXPORT_METHOD(animateCamera:(nonnull NSNumber *)ABI47_0_0ReactTag
                  withCamera:(id)json
                  withDuration:(CGFloat)duration)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
        } else {
            ABI47_0_0AIRMap *mapView = (ABI47_0_0AIRMap *)view;

            // Merge the changes given with the current camera
            MKMapCamera *camera = [ABI47_0_0RCTConvert MKMapCameraWithDefaults:json existingCamera:[mapView camera]];

            // don't emit region change events when we are setting the camera
            BOOL originalIgnore = mapView.ignoreRegionChanges;
            mapView.ignoreRegionChanges = YES;
            [ABI47_0_0AIRMap animateWithDuration:duration/1000 animations:^{
                [mapView setCamera:camera animated:YES];
            } completion:^(BOOL finished){
                mapView.ignoreRegionChanges = originalIgnore;
            }];
        }
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(animateToRegion:(nonnull NSNumber *)ABI47_0_0ReactTag
        withRegion:(MKCoordinateRegion)region
        withDuration:(CGFloat)duration)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
        } else {
            [ABI47_0_0AIRMap animateWithDuration:duration/1000 animations:^{
                [(ABI47_0_0AIRMap *)view setRegion:region animated:YES];
            }];
        }
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(fitToElements:(nonnull NSNumber *)ABI47_0_0ReactTag
        edgePadding:(nonnull NSDictionary *)edgePadding
        animated:(BOOL)animated)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
        } else {
            ABI47_0_0AIRMap *mapView = (ABI47_0_0AIRMap *)view;
            // TODO(lmr): we potentially want to include overlays here... and could concat the two arrays together.
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
                [mapView showAnnotations:mapView.annotations animated:animated];
            });
        }
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(fitToSuppliedMarkers:(nonnull NSNumber *)ABI47_0_0ReactTag
                  markers:(nonnull NSArray *)markers
                  edgePadding:(nonnull NSDictionary *)edgePadding
                  animated:(BOOL)animated)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
        } else {
            ABI47_0_0AIRMap *mapView = (ABI47_0_0AIRMap *)view;
            // TODO(lmr): we potentially want to include overlays here... and could concat the two arrays together.
            // id annotations = mapView.annotations;

            NSPredicate *filterMarkers = [NSPredicate predicateWithBlock:^BOOL(id evaluatedObject, NSDictionary *bindings) {
                ABI47_0_0AIRMapMarker *marker = (ABI47_0_0AIRMapMarker *)evaluatedObject;
                return [marker isKindOfClass:[ABI47_0_0AIRMapMarker class]] && [markers containsObject:marker.identifier];
            }];

            NSArray *filteredMarkers = [mapView.annotations filteredArrayUsingPredicate:filterMarkers];

            [mapView showAnnotations:filteredMarkers animated:animated];

        }
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(fitToCoordinates:(nonnull NSNumber *)ABI47_0_0ReactTag
                  coordinates:(nonnull NSArray<ABI47_0_0AIRMapCoordinate *> *)coordinates
                  edgePadding:(nonnull NSDictionary *)edgePadding
                  animated:(BOOL)animated)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
        } else {
            ABI47_0_0AIRMap *mapView = (ABI47_0_0AIRMap *)view;

            // Create Polyline with coordinates
            CLLocationCoordinate2D coords[coordinates.count];
            for(int i = 0; i < coordinates.count; i++)
            {
                coords[i] = coordinates[i].coordinate;
            }
            MKPolyline *polyline = [MKPolyline polylineWithCoordinates:coords count:coordinates.count];

            // Set Map viewport
            CGFloat top = [ABI47_0_0RCTConvert CGFloat:edgePadding[@"top"]];
            CGFloat right = [ABI47_0_0RCTConvert CGFloat:edgePadding[@"right"]];
            CGFloat bottom = [ABI47_0_0RCTConvert CGFloat:edgePadding[@"bottom"]];
            CGFloat left = [ABI47_0_0RCTConvert CGFloat:edgePadding[@"left"]];

            [mapView setVisibleMapRect:[polyline boundingMapRect] edgePadding:UIEdgeInsetsMake(top, left, bottom, right) animated:animated];

        }
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(takeSnapshot:(nonnull NSNumber *)ABI47_0_0ReactTag
        width:(nonnull NSNumber *)width
        height:(nonnull NSNumber *)height
        region:(MKCoordinateRegion)region
        format:(nonnull NSString *)format
        quality:(nonnull NSNumber *)quality
        result:(nonnull NSString *)result
        callback:(ABI47_0_0RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            ABI47_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view);
        } else {
            ABI47_0_0AIRMap *mapView = (ABI47_0_0AIRMap *)view;
            MKMapSnapshotOptions *options = [[MKMapSnapshotOptions alloc] init];

            options.mapType = mapView.mapType;
            options.region = (region.center.latitude && region.center.longitude) ? region : mapView.region;
            options.size = CGSizeMake(
              ([width floatValue] == 0) ? mapView.bounds.size.width : [width floatValue],
              ([height floatValue] == 0) ? mapView.bounds.size.height : [height floatValue]
            );
            options.scale = [[UIScreen mainScreen] scale];

            MKMapSnapshotter *snapshotter = [[MKMapSnapshotter alloc] initWithOptions:options];

            [self takeMapSnapshot:mapView
                snapshotter:snapshotter
                format:format
                quality:quality.floatValue
                result:result
                callback:callback];
        }
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(pointForCoordinate:(nonnull NSNumber *)ABI47_0_0ReactTag
                  coordinate: (NSDictionary *)coordinate
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI47_0_0RCTPromiseRejectBlock)reject)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        ABI47_0_0AIRMap *mapView = (ABI47_0_0AIRMap *)view;
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            reject(@"Invalid argument", [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view], NULL);
        } else {
            CGPoint touchPoint = [mapView convertCoordinate:
                                  CLLocationCoordinate2DMake(
                                                             [coordinate[@"latitude"] doubleValue],
                                                             [coordinate[@"longitude"] doubleValue]
                                                             )
                                              toPointToView:mapView];

            resolve(@{
                      @"x": @(touchPoint.x),
                      @"y": @(touchPoint.y),
                      });
        }
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(getMarkersFrames:(nonnull NSNumber *)ABI47_0_0ReactTag
                  onlyVisible:(BOOL)onlyVisible
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI47_0_0RCTPromiseRejectBlock)reject)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        ABI47_0_0AIRMap *mapView = (ABI47_0_0AIRMap *)view;
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            reject(@"Invalid argument", [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view], NULL);
        } else {
            resolve([mapView getMarkersFramesWithOnlyVisible:onlyVisible]);
        }
    }];
}



ABI47_0_0RCT_EXPORT_METHOD(coordinateForPoint:(nonnull NSNumber *)ABI47_0_0ReactTag
                  point:(NSDictionary *)point
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI47_0_0RCTPromiseRejectBlock)reject)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        ABI47_0_0AIRMap *mapView = (ABI47_0_0AIRMap *)view;
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            reject(@"Invalid argument", [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view], NULL);
        } else {
            CLLocationCoordinate2D coordinate = [mapView convertPoint:
                                                 CGPointMake(
                                                             [point[@"x"] doubleValue],
                                                             [point[@"y"] doubleValue]
                                                             )
                                                 toCoordinateFromView:mapView];

            resolve(@{
                      @"latitude": @(coordinate.latitude),
                      @"longitude": @(coordinate.longitude),
                      });
        }
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(getAddressFromCoordinates:(nonnull NSNumber *)ABI47_0_0ReactTag
                                 coordinate: (NSDictionary *)coordinate
                                   resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                                   rejecter:(ABI47_0_0RCTPromiseRejectBlock)reject)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI47_0_0ReactTag];
        if (![view isKindOfClass:[ABI47_0_0AIRMap class]]) {
            reject(@"Invalid argument", [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI47_0_0AIRMap, got: %@", view], NULL);
        } else {
            if (coordinate == nil ||
                ![[coordinate allKeys] containsObject:@"latitude"] ||
                ![[coordinate allKeys] containsObject:@"longitude"]) {
                reject(@"Invalid argument", [NSString stringWithFormat:@"Invalid coordinate format"], NULL);
            }
            CLLocation *location = [[CLLocation alloc] initWithLatitude:[coordinate[@"latitude"] doubleValue]
                                                              longitude:[coordinate[@"longitude"] doubleValue]];
            CLGeocoder *geoCoder = [[CLGeocoder alloc] init];
            [geoCoder reverseGeocodeLocation:location
                           completionHandler:^(NSArray *placemarks, NSError *error) {
                    if (error == nil && [placemarks count] > 0){
                        CLPlacemark *placemark = placemarks[0];
                        resolve(@{
                            @"name" : [NSString stringWithFormat:@"%@", placemark.name],
                            @"thoroughfare" : [NSString stringWithFormat:@"%@", placemark.thoroughfare],
                            @"subThoroughfare" : [NSString stringWithFormat:@"%@", placemark.subThoroughfare],
                            @"locality" : [NSString stringWithFormat:@"%@", placemark.locality],
                            @"subLocality" : [NSString stringWithFormat:@"%@", placemark.subLocality],
                            @"administrativeArea" : [NSString stringWithFormat:@"%@", placemark.administrativeArea],
                            @"subAdministrativeArea" : [NSString stringWithFormat:@"%@", placemark.subAdministrativeArea],
                            @"postalCode" : [NSString stringWithFormat:@"%@", placemark.postalCode],
                            @"countryCode" : [NSString stringWithFormat:@"%@", placemark.ISOcountryCode],
                            @"country" : [NSString stringWithFormat:@"%@", placemark.country],
                        });
                    } else {
                        reject(@"Invalid argument", [NSString stringWithFormat:@"Can not get address location"], NULL);
                    }
            }];
        }
    }];
}

#pragma mark Take Snapshot
- (void)takeMapSnapshot:(ABI47_0_0AIRMap *)mapView
        snapshotter:(MKMapSnapshotter *) snapshotter
        format:(NSString *)format
        quality:(CGFloat) quality
        result:(NSString *)result
        callback:(ABI47_0_0RCTResponseSenderBlock) callback {
    NSTimeInterval timeStamp = [[NSDate date] timeIntervalSince1970];
    NSString *pathComponent = [NSString stringWithFormat:@"Documents/snapshot-%.20lf.%@", timeStamp, format];
    NSString *filePath = [NSHomeDirectory() stringByAppendingPathComponent: pathComponent];

    [snapshotter startWithQueue:dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0)
              completionHandler:^(MKMapSnapshot *snapshot, NSError *error) {
                  if (error) {
                      callback(@[error]);
                      return;
                  }
                  MKAnnotationView *pin = [[MKPinAnnotationView alloc] initWithAnnotation:nil reuseIdentifier:nil];

                  UIImage *image = snapshot.image;
                  UIGraphicsBeginImageContextWithOptions(image.size, YES, image.scale);
                  {
                      [image drawAtPoint:CGPointMake(0.0f, 0.0f)];

                      CGRect rect = CGRectMake(0.0f, 0.0f, image.size.width, image.size.height);

                      for (id <ABI47_0_0AIRMapSnapshot> overlay in mapView.overlays) {
                          if ([overlay respondsToSelector:@selector(drawToSnapshot:context:)]) {
                                  [overlay drawToSnapshot:snapshot context:UIGraphicsGetCurrentContext()];
                          }
                      }
                      
                      for (id <MKAnnotation> annotation in mapView.annotations) {
                          CGPoint point = [snapshot pointForCoordinate:annotation.coordinate];
                          
                          MKAnnotationView* anView = [mapView viewForAnnotation: annotation];
                          
                          if (anView){
                              pin = anView;
                          }
                          
                          if (CGRectContainsPoint(rect, point)) {
                              point.x = point.x + pin.centerOffset.x - (pin.bounds.size.width / 2.0f);
                              point.y = point.y + pin.centerOffset.y - (pin.bounds.size.height / 2.0f);
                              if (pin.image) {
                                  [pin.image drawAtPoint:point];
                              } else {
                                  CGRect pinRect = CGRectMake(point.x, point.y, pin.bounds.size.width, pin.bounds.size.height);
                                  [pin drawViewHierarchyInRect:pinRect afterScreenUpdates:NO];
                              }
                          }
                      }

                      UIImage *compositeImage = UIGraphicsGetImageFromCurrentImageContext();

                      NSData *data;
                      if ([format isEqualToString:@"png"]) {
                          data = UIImagePNGRepresentation(compositeImage);
                      }
                      else if([format isEqualToString:@"jpg"]) {
                          data = UIImageJPEGRepresentation(compositeImage, quality);
                      }

                      if ([result isEqualToString:@"file"]) {
                          [data writeToFile:filePath atomically:YES];
                          callback(@[[NSNull null], filePath]);
                      }
                      else if ([result isEqualToString:@"base64"]) {
                          callback(@[[NSNull null], [data base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithCarriageReturn]]);
                      }
                  }
                  UIGraphicsEndImageContext();
              }];
}

#pragma mark Gesture Recognizer Handlers

#define MAX_DISTANCE_PX 10.0f
- (void)handleMapTap:(UITapGestureRecognizer *)recognizer {
    ABI47_0_0AIRMap *map = (ABI47_0_0AIRMap *)recognizer.view;

    CGPoint tapPoint = [recognizer locationInView:map];
    CLLocationCoordinate2D tapCoordinate = [map convertPoint:tapPoint toCoordinateFromView:map];
    MKMapPoint mapPoint = MKMapPointForCoordinate(tapCoordinate);
    CGPoint mapPointAsCGP = CGPointMake(mapPoint.x, mapPoint.y);

    double maxMeters = [self metersFromPixel:MAX_DISTANCE_PX atPoint:tapPoint forMap:map];
    float nearestDistance = MAXFLOAT;
    ABI47_0_0AIRMapPolyline *nearestPolyline = nil;

    for (id<MKOverlay> overlay in map.overlays) {
        if([overlay isKindOfClass:[ABI47_0_0AIRMapPolygon class]]){
            ABI47_0_0AIRMapPolygon *polygon = (ABI47_0_0AIRMapPolygon*) overlay;
            if (polygon.onPress) {
                CGMutablePathRef mpr = CGPathCreateMutable();

                for(int i = 0; i < polygon.coordinates.count; i++) {
                    ABI47_0_0AIRMapCoordinate *c = polygon.coordinates[i];
                    MKMapPoint mp = MKMapPointForCoordinate(c.coordinate);
                    if (i == 0) {
                        CGPathMoveToPoint(mpr, NULL, mp.x, mp.y);
                    } else {
                        CGPathAddLineToPoint(mpr, NULL, mp.x, mp.y);
                    }
                }

                if (CGPathContainsPoint(mpr, NULL, mapPointAsCGP, FALSE)) {
                    id event = @{
                                @"action": @"polygon-press",
                                @"coordinate": @{
                                    @"latitude": @(tapCoordinate.latitude),
                                    @"longitude": @(tapCoordinate.longitude),
                                },
                            };
                    polygon.onPress(event);
                }

                CGPathRelease(mpr);
            }
        }

        if([overlay isKindOfClass:[ABI47_0_0AIRMapPolyline class]]){
            ABI47_0_0AIRMapPolyline *polyline = (ABI47_0_0AIRMapPolyline*) overlay;
            if (polyline.onPress) {
                float distance = [self distanceOfPoint:MKMapPointForCoordinate(tapCoordinate)
                                          toPoly:polyline];
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestPolyline = polyline;
                }
            }
        }

        if ([overlay isKindOfClass:[ABI47_0_0AIRMapOverlay class]]) {
            ABI47_0_0AIRMapOverlay *imageOverlay = (ABI47_0_0AIRMapOverlay*) overlay;
            if (MKMapRectContainsPoint(imageOverlay.boundingMapRect, mapPoint)) {
                if (imageOverlay.onPress) {
                    id event = @{
                                 @"action": @"image-overlay-press",
                                 @"name": imageOverlay.name ?: @"unknown",
                                 @"coordinate": @{
                                         @"latitude": @(imageOverlay.coordinate.latitude),
                                         @"longitude": @(imageOverlay.coordinate.longitude)
                                         }
                                 };
                    imageOverlay.onPress(event);
                }
            }
        }

    }

    if (nearestDistance <= maxMeters) {
        id event = @{
                   @"action": @"polyline-press",
                   @"coordinate": @{
                       @"latitude": @(tapCoordinate.latitude),
                       @"longitude": @(tapCoordinate.longitude)
                   }
                   };
        nearestPolyline.onPress(event);
    }

    if (!map.onPress) return;
    map.onPress(@{
            @"coordinate": @{
                    @"latitude": @(tapCoordinate.latitude),
                    @"longitude": @(tapCoordinate.longitude),
            },
            @"position": @{
                    @"x": @(tapPoint.x),
                    @"y": @(tapPoint.y),
            },
    });

}

- (void)handleMapDrag:(UIPanGestureRecognizer*)recognizer {
    ABI47_0_0AIRMap *map = (ABI47_0_0AIRMap *)recognizer.view;
    if (!map.onPanDrag) return;

    CGPoint touchPoint = [recognizer locationInView:map];
    CLLocationCoordinate2D coord = [map convertPoint:touchPoint toCoordinateFromView:map];
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

- (void)handleMapDoubleTap:(UIPanGestureRecognizer*)recognizer {
    ABI47_0_0AIRMap *map = (ABI47_0_0AIRMap *)recognizer.view;
    if (!map.onDoublePress) return;
    
    CGPoint touchPoint = [recognizer locationInView:map];
    CLLocationCoordinate2D coord = [map convertPoint:touchPoint toCoordinateFromView:map];
    map.onDoublePress(@{
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


- (void)handleMapLongPress:(UITapGestureRecognizer *)recognizer {

    // NOTE: android only does the equivalent of "began", so we only send in this case
    if (recognizer.state != UIGestureRecognizerStateBegan) return;

    ABI47_0_0AIRMap *map = (ABI47_0_0AIRMap *)recognizer.view;
    if (!map.onLongPress) return;

    CGPoint touchPoint = [recognizer locationInView:map];
    CLLocationCoordinate2D coord = [map convertPoint:touchPoint toCoordinateFromView:map];

    map.onLongPress(@{
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

#pragma mark MKMapViewDelegate

#pragma mark Polyline stuff

- (MKOverlayRenderer *)mapView:(MKMapView *)mapView rendererForOverlay:(id <MKOverlay>)overlay{
    if ([overlay isKindOfClass:[ABI47_0_0AIRMapPolyline class]]) {
        return ((ABI47_0_0AIRMapPolyline *)overlay).renderer;
    } else if ([overlay isKindOfClass:[ABI47_0_0AIRMapPolygon class]]) {
        return ((ABI47_0_0AIRMapPolygon *)overlay).renderer;
    } else if ([overlay isKindOfClass:[ABI47_0_0AIRMapCircle class]]) {
        return ((ABI47_0_0AIRMapCircle *)overlay).renderer;
    } else if ([overlay isKindOfClass:[ABI47_0_0AIRMapUrlTile class]]) {
        return ((ABI47_0_0AIRMapUrlTile *)overlay).renderer;
    } else if ([overlay isKindOfClass:[ABI47_0_0AIRMapWMSTile class]]) {
        return ((ABI47_0_0AIRMapWMSTile *)overlay).renderer;
    } else if ([overlay isKindOfClass:[ABI47_0_0AIRMapLocalTile class]]) {
        return ((ABI47_0_0AIRMapLocalTile *)overlay).renderer;
    } else if ([overlay isKindOfClass:[ABI47_0_0AIRMapOverlay class]]) {
        return ((ABI47_0_0AIRMapOverlay *)overlay).renderer;
    } else if([overlay isKindOfClass:[MKTileOverlay class]]) {
        return [[MKTileOverlayRenderer alloc] initWithTileOverlay:overlay];
    } else {
        return nil;
    }
}


#pragma mark Annotation Stuff

- (void)mapView:(ABI47_0_0AIRMap *)mapView didAddAnnotationViews:(NSArray<MKAnnotationView *> *)views
{
    if(!mapView.userLocationCalloutEnabled){
        for(MKAnnotationView* view in views){
            if ([view.annotation isKindOfClass:[MKUserLocation class]]){
                [view setEnabled:NO];
                [view setCanShowCallout:NO];
                break;
            }
        }
    }
}


- (void)mapView:(ABI47_0_0AIRMap *)mapView didSelectAnnotationView:(MKAnnotationView *)view
{
    if ([view.annotation isKindOfClass:[ABI47_0_0AIRMapMarker class]]) {
        [(ABI47_0_0AIRMapMarker *)view.annotation showCalloutView];
    } else if ([view.annotation isKindOfClass:[MKUserLocation class]] && mapView.userLocationAnnotationTitle != nil && view.annotation.title != mapView.userLocationAnnotationTitle) {
        [(MKUserLocation*)view.annotation setTitle: mapView.userLocationAnnotationTitle];
    }

}

- (void)mapView:(ABI47_0_0AIRMap *)mapView didDeselectAnnotationView:(MKAnnotationView *)view {
    if ([view.annotation isKindOfClass:[ABI47_0_0AIRMapMarker class]]) {
        [(ABI47_0_0AIRMapMarker *)view.annotation hideCalloutView];
    }
}

- (MKAnnotationView *)mapView:(__unused ABI47_0_0AIRMap *)mapView viewForAnnotation:(ABI47_0_0AIRMapMarker *)marker
{
    if (![marker isKindOfClass:[ABI47_0_0AIRMapMarker class]]) {
        if ([marker isKindOfClass:[MKUserLocation class]] && mapView.userLocationAnnotationTitle != nil) {
            [(MKUserLocation*)marker setTitle: mapView.userLocationAnnotationTitle];
            return nil;
        }
        return nil;
    }

    marker.map = mapView;
    return [marker getAnnotationView];
}

static int kDragCenterContext;

- (void)mapView:(ABI47_0_0AIRMap *)mapView
    annotationView:(MKAnnotationView *)view
    didChangeDragState:(MKAnnotationViewDragState)newState
    fromOldState:(MKAnnotationViewDragState)oldState
{
    if (![view.annotation isKindOfClass:[ABI47_0_0AIRMapMarker class]]) return;
    ABI47_0_0AIRMapMarker *marker = (ABI47_0_0AIRMapMarker *)view.annotation;

    BOOL isPinView = [view isKindOfClass:[MKPinAnnotationView class]];

    id event = @{
                 @"id": marker.identifier ?: @"unknown",
                 @"coordinate": @{
                         @"latitude": @(marker.coordinate.latitude),
                         @"longitude": @(marker.coordinate.longitude)
                         }
                 };

    if (newState == MKAnnotationViewDragStateEnding || newState == MKAnnotationViewDragStateCanceling) {
        if (!isPinView) {
            [view setDragState:MKAnnotationViewDragStateNone animated:NO];
        }
        if (mapView.onMarkerDragEnd) mapView.onMarkerDragEnd(event);
        if (marker.onDragEnd) marker.onDragEnd(event);

       if(_hasObserver) [view removeObserver:self forKeyPath:@"center"];
        _hasObserver = NO;
    } else if (newState == MKAnnotationViewDragStateStarting) {
        // MapKit doesn't emit continuous drag events. To get around this, we are going to use KVO.
        [view addObserver:self forKeyPath:@"center" options:NSKeyValueObservingOptionNew context:&kDragCenterContext];
        _hasObserver = YES;
        if (mapView.onMarkerDragStart) mapView.onMarkerDragStart(event);
        if (marker.onDragStart) marker.onDragStart(event);
    }
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context
{
    if ([keyPath isEqualToString:@"center"] && [object isKindOfClass:[MKAnnotationView class]]) {
        MKAnnotationView *view = (MKAnnotationView *)object;
        ABI47_0_0AIRMapMarker *marker = (ABI47_0_0AIRMapMarker *)view.annotation;

        // a marker we don't control might be getting dragged. Check just in case.
        if (!marker) return;

        ABI47_0_0AIRMap *map = marker.map;

        // don't waste time calculating if there are no events to listen to it
        if (!map.onMarkerDrag && !marker.onDrag) return;

        CGPoint position = CGPointMake(view.center.x - view.centerOffset.x, view.center.y - view.centerOffset.y);
        CLLocationCoordinate2D coordinate = [map convertPoint:position toCoordinateFromView:map];

        id event = @{
                @"id": marker.identifier ?: @"unknown",
                @"position": @{
                        @"x": @(position.x),
                        @"y": @(position.y),
                },
                @"coordinate": @{
                        @"latitude": @(coordinate.latitude),
                        @"longitude": @(coordinate.longitude),
                }
        };

        if (map.onMarkerDrag) map.onMarkerDrag(event);
        if (marker.onDrag) marker.onDrag(event);

    } else {
        // This message is not for me; pass it on to super.
        [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
    }
}

- (void)mapView:(ABI47_0_0AIRMap *)mapView didUpdateUserLocation:(MKUserLocation *)location
{
    id event = @{@"coordinate": @{
                         @"latitude": @(location.coordinate.latitude),
                         @"longitude": @(location.coordinate.longitude),
                         @"altitude": @(location.location.altitude),
                         @"timestamp": @(location.location.timestamp.timeIntervalSinceReferenceDate * 1000),
                         @"accuracy": @(location.location.horizontalAccuracy),
                         @"altitudeAccuracy": @(location.location.verticalAccuracy),
                         @"speed": @(location.location.speed),
                         @"heading": @(location.location.course),
                         }
                 };
    
    if (mapView.onUserLocationChange) {
        mapView.onUserLocationChange(event);
    }
    
    if (mapView.followUserLocation) {
        MKCoordinateRegion region;
        region.span.latitudeDelta = ABI47_0_0AIRMapDefaultSpan;
        region.span.longitudeDelta = ABI47_0_0AIRMapDefaultSpan;
        region.center = location.coordinate;
        [mapView setRegion:region animated:YES];

        // Move to user location only for the first time it loads up.
        // mapView.followUserLocation = NO;
    }
    
}

- (void)mapViewDidChangeVisibleRegion:(ABI47_0_0AIRMap *)mapView
{
    [self _regionChanged:mapView];
}

- (void)mapView:(ABI47_0_0AIRMap *)mapView regionDidChangeAnimated:(__unused BOOL)animated
{
    CGFloat zoomLevel = [self zoomLevel:mapView];

    // Don't send region did change events until map has
    // started rendering, as these won't represent the final location
    if(mapView.hasStartedRendering){
        [self _regionChanged:mapView];
    }

    if (zoomLevel < mapView.minZoomLevel) {
      [self setCenterCoordinate:[mapView centerCoordinate] zoomLevel:mapView.minZoomLevel animated:TRUE mapView:mapView];
    }
    else if (zoomLevel > mapView.maxZoomLevel) {
      [self setCenterCoordinate:[mapView centerCoordinate] zoomLevel:mapView.maxZoomLevel animated:TRUE mapView:mapView];
    }

    // Don't send region did change events until map has
    // started rendering, as these won't represent the final location
    if (mapView.hasStartedRendering) {
        [self _emitRegionChangeEvent:mapView continuous:NO];
    };

    mapView.pendingCenter = mapView.region.center;
    mapView.pendingSpan = mapView.region.span;
}

- (void)mapViewWillStartRenderingMap:(ABI47_0_0AIRMap *)mapView
{
    if (!mapView.hasStartedRendering) {
      mapView.onMapReady(@{});
      mapView.hasStartedRendering = YES;
    }
    [mapView beginLoading];
}

- (void)mapViewDidFinishRenderingMap:(ABI47_0_0AIRMap *)mapView fullyRendered:(BOOL)fullyRendered
{
    [mapView finishLoading];
}

#pragma mark Private

- (void)_regionChanged:(ABI47_0_0AIRMap *)mapView
{
    BOOL needZoom = NO;
    CGFloat newLongitudeDelta = 0.0f;
    MKCoordinateRegion region = mapView.region;
    // On iOS 7, it's possible that we observe invalid locations during initialization of the map.
    // Filter those out.
    if (!CLLocationCoordinate2DIsValid(region.center)) {
        return;
    }
    // Calculation on float is not 100% accurate. If user zoom to max/min and then move, it's likely the map will auto zoom to max/min from time to time.
    // So let's try to make map zoom back to 99% max or 101% min so that there are some buffer that moving the map won't constantly hitting the max/min bound.
    if (mapView.maxDelta > FLT_EPSILON && region.span.longitudeDelta > mapView.maxDelta) {
        needZoom = YES;
        newLongitudeDelta = mapView.maxDelta * (1 - ABI47_0_0AIRMapZoomBoundBuffer);
    } else if (mapView.minDelta > FLT_EPSILON && region.span.longitudeDelta < mapView.minDelta) {
        needZoom = YES;
        newLongitudeDelta = mapView.minDelta * (1 + ABI47_0_0AIRMapZoomBoundBuffer);
    }
    if (needZoom) {
        region.span.latitudeDelta = region.span.latitudeDelta / region.span.longitudeDelta * newLongitudeDelta;
        region.span.longitudeDelta = newLongitudeDelta;
        mapView.region = region;
    }

    // Continuously observe region changes
    [self _emitRegionChangeEvent:mapView continuous:YES];
}

- (void)_emitRegionChangeEvent:(ABI47_0_0AIRMap *)mapView continuous:(BOOL)continuous
{
    if (!mapView.ignoreRegionChanges && mapView.onChange) {
        MKCoordinateRegion region = mapView.region;
        if (!CLLocationCoordinate2DIsValid(region.center)) {
            return;
        }

#define FLUSH_NAN(value) (isnan(value) ? 0 : value)
        mapView.onChange(@{
                @"continuous": @(continuous),
                @"region": @{
                        @"latitude": @(FLUSH_NAN(region.center.latitude)),
                        @"longitude": @(FLUSH_NAN(region.center.longitude)),
                        @"latitudeDelta": @(FLUSH_NAN(region.span.latitudeDelta)),
                        @"longitudeDelta": @(FLUSH_NAN(region.span.longitudeDelta)),
                }
        });
    }
}

/** Returns the distance of |pt| to |poly| in meters
 *
 *
 */
- (double)distanceOfPoint:(MKMapPoint)pt toPoly:(ABI47_0_0AIRMapPolyline *)poly
{
    double distance = MAXFLOAT;
    for (int n = 0; n < poly.coordinates.count - 1; n++) {

        MKMapPoint ptA = MKMapPointForCoordinate(poly.coordinates[n].coordinate);
        MKMapPoint ptB = MKMapPointForCoordinate(poly.coordinates[n + 1].coordinate);

        double xDelta = ptB.x - ptA.x;
        double yDelta = ptB.y - ptA.y;

        if (xDelta == 0.0 && yDelta == 0.0) {
            continue;
        }

        double u = ((pt.x - ptA.x) * xDelta + (pt.y - ptA.y) * yDelta) / (xDelta * xDelta + yDelta * yDelta);
        MKMapPoint ptClosest;
        if (u < 0.0) {
            ptClosest = ptA;
        }
        else if (u > 1.0) {
            ptClosest = ptB;
        }
        else {
            ptClosest = MKMapPointMake(ptA.x + u * xDelta, ptA.y + u * yDelta);
        }

        distance = MIN(distance, MKMetersBetweenMapPoints(ptClosest, pt));
    }

    return distance;
}


/** Converts |px| to meters at location |pt| */
- (double)metersFromPixel:(NSUInteger)px atPoint:(CGPoint)pt forMap:(ABI47_0_0AIRMap *)mapView
{
    CGPoint ptB = CGPointMake(pt.x + px, pt.y);

    CLLocationCoordinate2D coordA = [mapView convertPoint:pt toCoordinateFromView:mapView];
    CLLocationCoordinate2D coordB = [mapView convertPoint:ptB toCoordinateFromView:mapView];

    return MKMetersBetweenMapPoints(MKMapPointForCoordinate(coordA), MKMapPointForCoordinate(coordB));
}

+ (double)longitudeToPixelSpaceX:(double)longitude
{
    return round(MERCATOR_OFFSET + MERCATOR_RADIUS * longitude * M_PI / 180.0);
}

+ (double)latitudeToPixelSpaceY:(double)latitude
{
	if (latitude == 90.0) {
		return 0;
	} else if (latitude == -90.0) {
		return MERCATOR_OFFSET * 2;
	} else {
		return round(MERCATOR_OFFSET - MERCATOR_RADIUS * logf((1 + sinf(latitude * M_PI / 180.0)) / (1 - sinf(latitude * M_PI / 180.0))) / 2.0);
	}
}

+ (double)pixelSpaceXToLongitude:(double)pixelX
{
    return ((round(pixelX) - MERCATOR_OFFSET) / MERCATOR_RADIUS) * 180.0 / M_PI;
}

+ (double)pixelSpaceYToLatitude:(double)pixelY
{
    return (M_PI / 2.0 - 2.0 * atan(exp((round(pixelY) - MERCATOR_OFFSET) / MERCATOR_RADIUS))) * 180.0 / M_PI;
}

#pragma mark -
#pragma mark Helper methods

- (MKCoordinateSpan)coordinateSpanWithMapView:(ABI47_0_0AIRMap *)mapView
                             centerCoordinate:(CLLocationCoordinate2D)centerCoordinate
                                 andZoomLevel:(double)zoomLevel
{
    // convert center coordiate to pixel space
    double centerPixelX = [ABI47_0_0AIRMapManager longitudeToPixelSpaceX:centerCoordinate.longitude];
    double centerPixelY = [ABI47_0_0AIRMapManager latitudeToPixelSpaceY:centerCoordinate.latitude];

    // determine the scale value from the zoom level
    double zoomExponent = ABI47_0_0AIRMapMaxZoomLevel - zoomLevel;
    double zoomScale = pow(2, zoomExponent);

    // scale the map’s size in pixel space
    CGSize mapSizeInPixels = mapView.bounds.size;
    double scaledMapWidth = mapSizeInPixels.width * zoomScale;
    double scaledMapHeight = mapSizeInPixels.height * zoomScale;

    // figure out the position of the top-left pixel
    double topLeftPixelX = centerPixelX - (scaledMapWidth / 2);
    double topLeftPixelY = centerPixelY - (scaledMapHeight / 2);

    // find delta between left and right longitudes
    CLLocationDegrees minLng = [ABI47_0_0AIRMapManager pixelSpaceXToLongitude:topLeftPixelX];
    CLLocationDegrees maxLng = [ABI47_0_0AIRMapManager pixelSpaceXToLongitude:topLeftPixelX + scaledMapWidth];
    CLLocationDegrees longitudeDelta = maxLng - minLng;

    // find delta between top and bottom latitudes
    CLLocationDegrees minLat = [ABI47_0_0AIRMapManager pixelSpaceYToLatitude:topLeftPixelY];
    CLLocationDegrees maxLat = [ABI47_0_0AIRMapManager pixelSpaceYToLatitude:topLeftPixelY + scaledMapHeight];
    CLLocationDegrees latitudeDelta = -1 * (maxLat - minLat);

    // create and return the lat/lng span
    MKCoordinateSpan span = MKCoordinateSpanMake(latitudeDelta, longitudeDelta);
    return span;
}

#pragma mark -
#pragma mark Public methods

- (void)setCenterCoordinate:(CLLocationCoordinate2D)centerCoordinate
                  zoomLevel:(double)zoomLevel
                   animated:(BOOL)animated
                    mapView:(ABI47_0_0AIRMap *)mapView
{
    // clamp large numbers to 28
    zoomLevel = MIN(zoomLevel, ABI47_0_0AIRMapMaxZoomLevel);

    // use the zoom level to compute the region
    MKCoordinateSpan span = [self coordinateSpanWithMapView:mapView centerCoordinate:centerCoordinate andZoomLevel:zoomLevel];
    MKCoordinateRegion region = MKCoordinateRegionMake(centerCoordinate, span);

    // set the region like normal
    [mapView setRegion:region animated:animated];
}

//KMapView cannot display tiles that cross the pole (as these would involve wrapping the map from top to bottom, something that a Mercator projection just cannot do).
-(MKCoordinateRegion)coordinateRegionWithMapView:(ABI47_0_0AIRMap *)mapView
                                centerCoordinate:(CLLocationCoordinate2D)centerCoordinate
                                    andZoomLevel:(double)zoomLevel
{
	// clamp lat/long values to appropriate ranges
	centerCoordinate.latitude = MIN(MAX(-90.0, centerCoordinate.latitude), 90.0);
	centerCoordinate.longitude = fmod(centerCoordinate.longitude, 180.0);

	// convert center coordiate to pixel space
	double centerPixelX = [ABI47_0_0AIRMapManager longitudeToPixelSpaceX:centerCoordinate.longitude];
	double centerPixelY = [ABI47_0_0AIRMapManager latitudeToPixelSpaceY:centerCoordinate.latitude];

	// determine the scale value from the zoom level
	double zoomExponent = ABI47_0_0AIRMapMaxZoomLevel - zoomLevel;
	double zoomScale = pow(2, zoomExponent);

	// scale the map’s size in pixel space
	CGSize mapSizeInPixels = mapView.bounds.size;
	double scaledMapWidth = mapSizeInPixels.width * zoomScale;
	double scaledMapHeight = mapSizeInPixels.height * zoomScale;

	// figure out the position of the left pixel
	double topLeftPixelX = centerPixelX - (scaledMapWidth / 2);

	// find delta between left and right longitudes
	CLLocationDegrees minLng = [ABI47_0_0AIRMapManager pixelSpaceXToLongitude:topLeftPixelX];
	CLLocationDegrees maxLng = [ABI47_0_0AIRMapManager pixelSpaceXToLongitude:topLeftPixelX + scaledMapWidth];
	CLLocationDegrees longitudeDelta = maxLng - minLng;

	// if we’re at a pole then calculate the distance from the pole towards the equator
	// as MKMapView doesn’t like drawing boxes over the poles
	double topPixelY = centerPixelY - (scaledMapHeight / 2);
	double bottomPixelY = centerPixelY + (scaledMapHeight / 2);
	BOOL adjustedCenterPoint = NO;
	if (topPixelY > MERCATOR_OFFSET * 2) {
		topPixelY = centerPixelY - scaledMapHeight;
		bottomPixelY = MERCATOR_OFFSET * 2;
		adjustedCenterPoint = YES;
	}

	// find delta between top and bottom latitudes
	CLLocationDegrees minLat = [ABI47_0_0AIRMapManager pixelSpaceYToLatitude:topPixelY];
	CLLocationDegrees maxLat = [ABI47_0_0AIRMapManager pixelSpaceYToLatitude:bottomPixelY];
	CLLocationDegrees latitudeDelta = -1 * (maxLat - minLat);

	// create and return the lat/lng span
	MKCoordinateSpan span = MKCoordinateSpanMake(latitudeDelta, longitudeDelta);
	MKCoordinateRegion region = MKCoordinateRegionMake(centerCoordinate, span);
	// once again, MKMapView doesn’t like drawing boxes over the poles
	// so adjust the center coordinate to the center of the resulting region
	if (adjustedCenterPoint) {
		region.center.latitude = [ABI47_0_0AIRMapManager pixelSpaceYToLatitude:((bottomPixelY + topPixelY) / 2.0)];
	}

	return region;
}

- (double) zoomLevel:(ABI47_0_0AIRMap *)mapView {
    MKCoordinateRegion region = mapView.region;

    double centerPixelX = [ABI47_0_0AIRMapManager longitudeToPixelSpaceX: region.center.longitude];
    double topLeftPixelX = [ABI47_0_0AIRMapManager longitudeToPixelSpaceX: region.center.longitude - region.span.longitudeDelta / 2];

    double scaledMapWidth = (centerPixelX - topLeftPixelX) * 2;
    CGSize mapSizeInPixels = mapView.bounds.size;
    double zoomScale = scaledMapWidth / mapSizeInPixels.width;
    double zoomExponent = log(zoomScale) / log(2);
    double zoomLevel = ABI47_0_0AIRMapMaxZoomLevel - zoomExponent;

    return zoomLevel;
}

#pragma mark MKMapViewDelegate - Tracking the User Location

- (void)mapView:(ABI47_0_0AIRMap *)mapView didFailToLocateUserWithError:(NSError *)error {
    id event = @{@"error": @{ @"message": error.localizedDescription }};
    if (mapView.onUserLocationChange) {
        mapView.onUserLocationChange(event);
    }
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer {
    return YES;
}

@end
