/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AIRMapManager.h"

#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTConvert.h>
#import <React/RCTConvert+CoreLocation.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTViewManager.h>
#import <React/UIView+React.h>
#import "AIRMap.h"
#import "AIRMapMarker.h"
#import "AIRMapPolyline.h"
#import "AIRMapPolygon.h"
#import "AIRMapCircle.h"
#import "SMCalloutView.h"
#import "AIRMapUrlTile.h"
#import "AIRMapSnapshot.h"
#import "RCTConvert+AirMap.h"

#import <MapKit/MapKit.h>

static NSString *const RCTMapViewKey = @"MapView";


@interface AIRMapManager() <MKMapViewDelegate>

@end

@implementation AIRMapManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
    AIRMap *map = [AIRMap new];
    map.delegate = self;

    // MKMapView doesn't report tap events, so we attach gesture recognizers to it
    UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleMapTap:)];
    UILongPressGestureRecognizer *longPress = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(handleMapLongPress:)];
    UIPanGestureRecognizer *drag = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(handleMapDrag:)];
    [drag setMinimumNumberOfTouches:1];
    [drag setMaximumNumberOfTouches:1];
    // setting this to NO allows the parent MapView to continue receiving marker selection events
    tap.cancelsTouchesInView = NO;
    longPress.cancelsTouchesInView = NO;

    // disable drag by default
    drag.enabled = NO;

    [map addGestureRecognizer:tap];
    [map addGestureRecognizer:longPress];
    [map addGestureRecognizer:drag];

    return map;
}

RCT_EXPORT_VIEW_PROPERTY(showsUserLocation, BOOL)
RCT_EXPORT_VIEW_PROPERTY(userLocationAnnotationTitle, NSString)
RCT_EXPORT_VIEW_PROPERTY(followsUserLocation, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showsPointsOfInterest, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showsBuildings, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showsCompass, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showsScale, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showsTraffic, BOOL)
RCT_EXPORT_VIEW_PROPERTY(zoomEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(rotateEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(pitchEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(cacheEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(loadingEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(loadingBackgroundColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(loadingIndicatorColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(handlePanDrag, BOOL)
RCT_EXPORT_VIEW_PROPERTY(maxDelta, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(minDelta, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(legalLabelInsets, UIEdgeInsets)
RCT_EXPORT_VIEW_PROPERTY(mapType, MKMapType)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPanDrag, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLongPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMarkerPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMarkerSelect, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMarkerDeselect, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMarkerDragStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMarkerDrag, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMarkerDragEnd, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(initialRegion, MKCoordinateRegion)

RCT_CUSTOM_VIEW_PROPERTY(region, MKCoordinateRegion, AIRMap)
{
    if (json == nil) return;

    // don't emit region change events when we are setting the region
    BOOL originalIgnore = view.ignoreRegionChanges;
    view.ignoreRegionChanges = YES;
    [view setRegion:[RCTConvert MKCoordinateRegion:json] animated:NO];
    view.ignoreRegionChanges = originalIgnore;
}


#pragma mark exported MapView methods

RCT_EXPORT_METHOD(animateToRegion:(nonnull NSNumber *)reactTag
        withRegion:(MKCoordinateRegion)region
        withDuration:(CGFloat)duration)
{
    [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[reactTag];
        if (![view isKindOfClass:[AIRMap class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting AIRMap, got: %@", view);
        } else {
            [AIRMap animateWithDuration:duration/1000 animations:^{
                [(AIRMap *)view setRegion:region animated:YES];
            }];
        }
    }];
}

RCT_EXPORT_METHOD(animateToCoordinate:(nonnull NSNumber *)reactTag
        withRegion:(CLLocationCoordinate2D)latlng
        withDuration:(CGFloat)duration)
{
    [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[reactTag];
        if (![view isKindOfClass:[AIRMap class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting AIRMap, got: %@", view);
        } else {
            AIRMap *mapView = (AIRMap *)view;
            MKCoordinateRegion region;
            region.span = mapView.region.span;
            region.center = latlng;
            [AIRMap animateWithDuration:duration/1000 animations:^{
                [mapView setRegion:region animated:YES];
            }];
        }
    }];
}

RCT_EXPORT_METHOD(fitToElements:(nonnull NSNumber *)reactTag
        animated:(BOOL)animated)
{
    [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[reactTag];
        if (![view isKindOfClass:[AIRMap class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting AIRMap, got: %@", view);
        } else {
            AIRMap *mapView = (AIRMap *)view;
            // TODO(lmr): we potentially want to include overlays here... and could concat the two arrays together.
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
                [mapView showAnnotations:mapView.annotations animated:animated];
            });
        }
    }];
}

RCT_EXPORT_METHOD(fitToSuppliedMarkers:(nonnull NSNumber *)reactTag
                  markers:(nonnull NSArray *)markers
                  animated:(BOOL)animated)
{
    [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[reactTag];
        if (![view isKindOfClass:[AIRMap class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting AIRMap, got: %@", view);
        } else {
            AIRMap *mapView = (AIRMap *)view;
            // TODO(lmr): we potentially want to include overlays here... and could concat the two arrays together.
            // id annotations = mapView.annotations;

            NSPredicate *filterMarkers = [NSPredicate predicateWithBlock:^BOOL(id evaluatedObject, NSDictionary *bindings) {
                AIRMapMarker *marker = (AIRMapMarker *)evaluatedObject;
                return [marker isKindOfClass:[AIRMapMarker class]] && [markers containsObject:marker.identifier];
            }];

            NSArray *filteredMarkers = [mapView.annotations filteredArrayUsingPredicate:filterMarkers];

            [mapView showAnnotations:filteredMarkers animated:animated];
        }
    }];
}

RCT_EXPORT_METHOD(fitToCoordinates:(nonnull NSNumber *)reactTag
                  coordinates:(nonnull NSArray<AIRMapCoordinate *> *)coordinates
                  edgePadding:(nonnull NSDictionary *)edgePadding
                  animated:(BOOL)animated)
{
    [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[reactTag];
        if (![view isKindOfClass:[AIRMap class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting AIRMap, got: %@", view);
        } else {
            AIRMap *mapView = (AIRMap *)view;

            // Create Polyline with coordinates
            CLLocationCoordinate2D coords[coordinates.count];
            for(int i = 0; i < coordinates.count; i++)
            {
                coords[i] = coordinates[i].coordinate;
            }
            MKPolyline *polyline = [MKPolyline polylineWithCoordinates:coords count:coordinates.count];

            // Set Map viewport
            CGFloat top = [RCTConvert CGFloat:edgePadding[@"top"]];
            CGFloat right = [RCTConvert CGFloat:edgePadding[@"right"]];
            CGFloat bottom = [RCTConvert CGFloat:edgePadding[@"bottom"]];
            CGFloat left = [RCTConvert CGFloat:edgePadding[@"left"]];

            [mapView setVisibleMapRect:[polyline boundingMapRect] edgePadding:UIEdgeInsetsMake(top, left, bottom, right) animated:animated];

        }
    }];
}

RCT_EXPORT_METHOD(takeSnapshot:(nonnull NSNumber *)reactTag
        width:(nonnull NSNumber *)width
        height:(nonnull NSNumber *)height
        region:(MKCoordinateRegion)region
        format:(nonnull NSString *)format
        quality:(nonnull NSNumber *)quality
        result:(nonnull NSString *)result
        callback:(RCTResponseSenderBlock)callback)
{
    [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[reactTag];
        if (![view isKindOfClass:[AIRMap class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting AIRMap, got: %@", view);
        } else {
            AIRMap *mapView = (AIRMap *)view;
            MKMapSnapshotOptions *options = [[MKMapSnapshotOptions alloc] init];

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

#pragma mark Take Snapshot
- (void)takeMapSnapshot:(AIRMap *)mapView
        snapshotter:(MKMapSnapshotter *) snapshotter
        format:(NSString *)format
        quality:(CGFloat) quality
        result:(NSString *)result
        callback:(RCTResponseSenderBlock) callback {
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

                      for (id <MKAnnotation> annotation in mapView.annotations) {
                          CGPoint point = [snapshot pointForCoordinate:annotation.coordinate];

                          MKAnnotationView* anView = [mapView viewForAnnotation: annotation];

                          if (anView){
                              pin = anView;
                          }

                          if (CGRectContainsPoint(rect, point)) {
                              point.x = point.x + pin.centerOffset.x - (pin.bounds.size.width / 2.0f);
                              point.y = point.y + pin.centerOffset.y - (pin.bounds.size.height / 2.0f);
                              [pin.image drawAtPoint:point];
                          }
                      }

                      for (id <AIRMapSnapshot> overlay in mapView.overlays) {
                          if ([overlay respondsToSelector:@selector(drawToSnapshot:context:)]) {
                                  [overlay drawToSnapshot:snapshot context:UIGraphicsGetCurrentContext()];
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

#pragma mark Gesture Recognizer Handlers

#define MAX_DISTANCE_PX 10.0f
- (void)handleMapTap:(UITapGestureRecognizer *)recognizer {
    AIRMap *map = (AIRMap *)recognizer.view;

    CGPoint tapPoint = [recognizer locationInView:map];
    CLLocationCoordinate2D tapCoordinate = [map convertPoint:tapPoint toCoordinateFromView:map];
    MKMapPoint mapPoint = MKMapPointForCoordinate(tapCoordinate);
    CGPoint mapPointAsCGP = CGPointMake(mapPoint.x, mapPoint.y);

    double maxMeters = [self metersFromPixel:MAX_DISTANCE_PX atPoint:tapPoint forMap:map];
    float nearestDistance = MAXFLOAT;
    AIRMapPolyline *nearestPolyline = nil;

    for (id<MKOverlay> overlay in map.overlays) {
        if([overlay isKindOfClass:[AIRMapPolygon class]]){
            AIRMapPolygon *polygon = (AIRMapPolygon*) overlay;
            if (polygon.onPress) {
                CGMutablePathRef mpr = CGPathCreateMutable();

                for(int i = 0; i < polygon.coordinates.count; i++) {
                    AIRMapCoordinate *c = polygon.coordinates[i];
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
                                };
                    polygon.onPress(event);
                }

                CGPathRelease(mpr);
            }
        }

        if([overlay isKindOfClass:[AIRMapPolyline class]]){
            AIRMapPolyline *polyline = (AIRMapPolyline*) overlay;
            if (polyline.onPress) {
                float distance = [self distanceOfPoint:MKMapPointForCoordinate(tapCoordinate)
                                          toPoly:polyline];
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestPolyline = polyline;
                }
            }
        }
    }

    if (nearestDistance <= maxMeters) {
        id event = @{
                   @"action": @"polyline-press",
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
    AIRMap *map = (AIRMap *)recognizer.view;
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


- (void)handleMapLongPress:(UITapGestureRecognizer *)recognizer {

    // NOTE: android only does the equivalent of "began", so we only send in this case
    if (recognizer.state != UIGestureRecognizerStateBegan) return;

    AIRMap *map = (AIRMap *)recognizer.view;
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
    if ([overlay isKindOfClass:[AIRMapPolyline class]]) {
        return ((AIRMapPolyline *)overlay).renderer;
    } else if ([overlay isKindOfClass:[AIRMapPolygon class]]) {
        return ((AIRMapPolygon *)overlay).renderer;
    } else if ([overlay isKindOfClass:[AIRMapCircle class]]) {
        return ((AIRMapCircle *)overlay).renderer;
    } else if ([overlay isKindOfClass:[AIRMapUrlTile class]]) {
        return ((AIRMapUrlTile *)overlay).renderer;
    } else {
        return nil;
    }
}


#pragma mark Annotation Stuff



- (void)mapView:(AIRMap *)mapView didSelectAnnotationView:(MKAnnotationView *)view
{
    if ([view.annotation isKindOfClass:[AIRMapMarker class]]) {
        [(AIRMapMarker *)view.annotation showCalloutView];
    } else if ([view.annotation isKindOfClass:[MKUserLocation class]] && mapView.userLocationAnnotationTitle != nil && view.annotation.title != mapView.userLocationAnnotationTitle) {
        [(MKUserLocation*)view.annotation setTitle: mapView.userLocationAnnotationTitle];
    }

}

- (void)mapView:(AIRMap *)mapView didDeselectAnnotationView:(MKAnnotationView *)view {
    if ([view.annotation isKindOfClass:[AIRMapMarker class]]) {
        [(AIRMapMarker *)view.annotation hideCalloutView];
    }
}

- (MKAnnotationView *)mapView:(__unused AIRMap *)mapView viewForAnnotation:(AIRMapMarker *)marker
{
    if (![marker isKindOfClass:[AIRMapMarker class]]) {
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

- (void)mapView:(AIRMap *)mapView
    annotationView:(MKAnnotationView *)view
    didChangeDragState:(MKAnnotationViewDragState)newState
    fromOldState:(MKAnnotationViewDragState)oldState
{
    if (![view.annotation isKindOfClass:[AIRMapMarker class]]) return;
    AIRMapMarker *marker = (AIRMapMarker *)view.annotation;

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

        [view removeObserver:self forKeyPath:@"center"];
    } else if (newState == MKAnnotationViewDragStateStarting) {
        // MapKit doesn't emit continuous drag events. To get around this, we are going to use KVO.
        [view addObserver:self forKeyPath:@"center" options:NSKeyValueObservingOptionNew context:&kDragCenterContext];

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
        AIRMapMarker *marker = (AIRMapMarker *)view.annotation;

        // a marker we don't control might be getting dragged. Check just in case.
        if (!marker) return;

        AIRMap *map = marker.map;

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

- (void)mapView:(AIRMap *)mapView didUpdateUserLocation:(MKUserLocation *)location
{
    if (mapView.followUserLocation) {
        MKCoordinateRegion region;
        region.span.latitudeDelta = AIRMapDefaultSpan;
        region.span.longitudeDelta = AIRMapDefaultSpan;
        region.center = location.coordinate;
        [mapView setRegion:region animated:YES];

        // Move to user location only for the first time it loads up.
        // mapView.followUserLocation = NO;
    }
}

- (void)mapView:(AIRMap *)mapView regionWillChangeAnimated:(__unused BOOL)animated
{
    [self _regionChanged:mapView];

    mapView.regionChangeObserveTimer = [NSTimer timerWithTimeInterval:AIRMapRegionChangeObserveInterval
                                                               target:self
                                                             selector:@selector(_onTick:)
                                                             userInfo:@{ RCTMapViewKey: mapView }
                                                              repeats:YES];

    [[NSRunLoop mainRunLoop] addTimer:mapView.regionChangeObserveTimer forMode:NSRunLoopCommonModes];
}

- (void)mapView:(AIRMap *)mapView regionDidChangeAnimated:(__unused BOOL)animated
{
    [mapView.regionChangeObserveTimer invalidate];
    mapView.regionChangeObserveTimer = nil;

    [self _regionChanged:mapView];

    // Don't send region did change events until map has
    // started rendering, as these won't represent the final location
    if (mapView.hasStartedRendering) {
        [self _emitRegionChangeEvent:mapView continuous:NO];
    };

    mapView.pendingCenter = mapView.region.center;
    mapView.pendingSpan = mapView.region.span;
}

- (void)mapViewWillStartRenderingMap:(AIRMap *)mapView
{
    mapView.hasStartedRendering = YES;
    [mapView beginLoading];
    [self _emitRegionChangeEvent:mapView continuous:NO];
}

- (void)mapViewDidFinishRenderingMap:(AIRMap *)mapView fullyRendered:(BOOL)fullyRendered
{
    [mapView finishLoading];
    [mapView cacheViewIfNeeded];
}

#pragma mark Private

- (void)_onTick:(NSTimer *)timer
{
    [self _regionChanged:timer.userInfo[RCTMapViewKey]];
}

- (void)_regionChanged:(AIRMap *)mapView
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
        newLongitudeDelta = mapView.maxDelta * (1 - AIRMapZoomBoundBuffer);
    } else if (mapView.minDelta > FLT_EPSILON && region.span.longitudeDelta < mapView.minDelta) {
        needZoom = YES;
        newLongitudeDelta = mapView.minDelta * (1 + AIRMapZoomBoundBuffer);
    }
    if (needZoom) {
        region.span.latitudeDelta = region.span.latitudeDelta / region.span.longitudeDelta * newLongitudeDelta;
        region.span.longitudeDelta = newLongitudeDelta;
        mapView.region = region;
    }

    // Continuously observe region changes
    [self _emitRegionChangeEvent:mapView continuous:YES];
}

- (void)_emitRegionChangeEvent:(AIRMap *)mapView continuous:(BOOL)continuous
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
- (double)distanceOfPoint:(MKMapPoint)pt toPoly:(AIRMapPolyline *)poly
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
- (double)metersFromPixel:(NSUInteger)px atPoint:(CGPoint)pt forMap:(AIRMap *)mapView
{
    CGPoint ptB = CGPointMake(pt.x + px, pt.y);

    CLLocationCoordinate2D coordA = [mapView convertPoint:pt toCoordinateFromView:mapView];
    CLLocationCoordinate2D coordB = [mapView convertPoint:ptB toCoordinateFromView:mapView];

    return MKMetersBetweenMapPoints(MKMapPointForCoordinate(coordA), MKMapPointForCoordinate(coordB));
}

@end
