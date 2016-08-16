/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTMapManager.h"

#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTConvert+CoreLocation.h"
#import "ABI7_0_0RCTConvert+MapKit.h"
#import "ABI7_0_0RCTEventDispatcher.h"
#import "ABI7_0_0RCTMap.h"
#import "ABI7_0_0RCTUtils.h"
#import "UIView+ReactABI7_0_0.h"
#import "ABI7_0_0RCTMapAnnotation.h"
#import "ABI7_0_0RCTMapOverlay.h"

#import <MapKit/MapKit.h>

static NSString *const ABI7_0_0RCTMapViewKey = @"MapView";

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_9_0

static NSString *const ABI7_0_0RCTMapPinRed = @"#ff3b30";
static NSString *const ABI7_0_0RCTMapPinGreen = @"#4cd964";
static NSString *const ABI7_0_0RCTMapPinPurple = @"#c969e0";

@implementation ABI7_0_0RCTConvert (MKPinAnnotationColor)

ABI7_0_0RCT_ENUM_CONVERTER(MKPinAnnotationColor, (@{
  ABI7_0_0RCTMapPinRed: @(MKPinAnnotationColorRed),
  ABI7_0_0RCTMapPinGreen: @(MKPinAnnotationColorGreen),
  ABI7_0_0RCTMapPinPurple: @(MKPinAnnotationColorPurple)
}), MKPinAnnotationColorRed, unsignedIntegerValue)

@end

#endif

@interface ABI7_0_0RCTMapAnnotationView : MKAnnotationView

@property (nonatomic, strong) UIView *contentView;

@end

@implementation ABI7_0_0RCTMapAnnotationView

- (void)setContentView:(UIView *)contentView
{
  [_contentView removeFromSuperview];
  _contentView = contentView;
  [self addSubview:_contentView];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  self.bounds = (CGRect){
    CGPointZero,
    _contentView.frame.size,
  };
}

@end

@interface ABI7_0_0RCTMapManager() <MKMapViewDelegate>

@end

@implementation ABI7_0_0RCTMapManager

ABI7_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI7_0_0RCTMap *map = [ABI7_0_0RCTMap new];
  map.delegate = self;
  return map;
}

ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(showsUserLocation, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(showsPointsOfInterest, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(showsCompass, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(followUserLocation, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(zoomEnabled, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(rotateEnabled, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(pitchEnabled, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(maxDelta, CGFloat)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(minDelta, CGFloat)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(legalLabelInsets, UIEdgeInsets)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(mapType, MKMapType)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(annotations, NSArray<ABI7_0_0RCTMapAnnotation *>)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(overlays, NSArray<ABI7_0_0RCTMapOverlay *>)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onAnnotationDragStateChange, ABI7_0_0RCTBubblingEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onAnnotationFocus, ABI7_0_0RCTBubblingEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onAnnotationBlur, ABI7_0_0RCTBubblingEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI7_0_0RCTBubblingEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI7_0_0RCTBubblingEventBlock)
ABI7_0_0RCT_CUSTOM_VIEW_PROPERTY(region, MKCoordinateRegion, ABI7_0_0RCTMap)
{
  [view setRegion:json ? [ABI7_0_0RCTConvert MKCoordinateRegion:json] : defaultView.region animated:YES];
}

#pragma mark MKMapViewDelegate

- (void)mapView:(ABI7_0_0RCTMap *)mapView didSelectAnnotationView:(MKAnnotationView *)view
{
  // TODO: Remove deprecated onAnnotationPress API call later.
  if (mapView.onPress && [view.annotation isKindOfClass:[ABI7_0_0RCTMapAnnotation class]]) {
    ABI7_0_0RCTMapAnnotation *annotation = (ABI7_0_0RCTMapAnnotation *)view.annotation;
    mapView.onPress(@{
      @"action": @"annotation-click",
      @"annotation": @{
        @"id": annotation.identifier,
        @"title": annotation.title ?: @"",
        @"subtitle": annotation.subtitle ?: @"",
        @"latitude": @(annotation.coordinate.latitude),
        @"longitude": @(annotation.coordinate.longitude)
      }
    });
  }

  if ([view.annotation isKindOfClass:[ABI7_0_0RCTMapAnnotation class]]) {
    ABI7_0_0RCTMapAnnotation *annotation = (ABI7_0_0RCTMapAnnotation *)view.annotation;
    if (mapView.onAnnotationFocus) {
      mapView.onAnnotationFocus(@{
        @"annotationId": annotation.identifier
      });
    }
  }
}

- (void)mapView:(ABI7_0_0RCTMap *)mapView didDeselectAnnotationView:(MKAnnotationView *)view
{
  if ([view.annotation isKindOfClass:[ABI7_0_0RCTMapAnnotation class]]) {
    ABI7_0_0RCTMapAnnotation *annotation = (ABI7_0_0RCTMapAnnotation *)view.annotation;
    if (mapView.onAnnotationBlur) {
      mapView.onAnnotationBlur(@{
        @"annotationId": annotation.identifier
      });
    }
  }
}

- (void)mapView:(ABI7_0_0RCTMap *)mapView annotationView:(MKAnnotationView *)view
                              didChangeDragState:(MKAnnotationViewDragState)newState
                                    fromOldState:(MKAnnotationViewDragState)oldState
{
  static NSArray *states;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    states = @[@"idle", @"starting", @"dragging", @"canceling", @"ending"];
  });

  if ([view.annotation isKindOfClass:[ABI7_0_0RCTMapAnnotation class]]) {
    ABI7_0_0RCTMapAnnotation *annotation = (ABI7_0_0RCTMapAnnotation *)view.annotation;
    if (mapView.onAnnotationDragStateChange) {
      mapView.onAnnotationDragStateChange(@{
        @"state": states[newState],
        @"oldState": states[oldState],
        @"annotationId": annotation.identifier,
        @"latitude": @(annotation.coordinate.latitude),
        @"longitude": @(annotation.coordinate.longitude),
      });
    }
  }
}

- (MKAnnotationView *)mapView:(ABI7_0_0RCTMap *)mapView
            viewForAnnotation:(ABI7_0_0RCTMapAnnotation *)annotation
{
  if (![annotation isKindOfClass:[ABI7_0_0RCTMapAnnotation class]]) {
    return nil;
  }

  MKAnnotationView *annotationView;
  if (annotation.viewIndex != NSNotFound &&
      annotation.viewIndex < mapView.ReactABI7_0_0Subviews.count) {

    NSString *reuseIdentifier = NSStringFromClass([ABI7_0_0RCTMapAnnotationView class]);
    annotationView = [mapView dequeueReusableAnnotationViewWithIdentifier:reuseIdentifier];
    if (!annotationView) {
      annotationView = [[ABI7_0_0RCTMapAnnotationView alloc] initWithAnnotation:annotation
                                                        reuseIdentifier:reuseIdentifier];
    }
    UIView *ReactABI7_0_0View = mapView.ReactABI7_0_0Subviews[annotation.viewIndex];
    ((ABI7_0_0RCTMapAnnotationView *)annotationView).contentView = ReactABI7_0_0View;

  } else if (annotation.image) {

    NSString *reuseIdentifier = NSStringFromClass([MKAnnotationView class]);
    annotationView =
      [mapView dequeueReusableAnnotationViewWithIdentifier:reuseIdentifier] ?:
      [[MKAnnotationView alloc] initWithAnnotation:annotation
                                   reuseIdentifier:reuseIdentifier];
    annotationView.image = annotation.image;

  } else {

    NSString *reuseIdentifier = NSStringFromClass([MKPinAnnotationView class]);
    annotationView =
      [mapView dequeueReusableAnnotationViewWithIdentifier:reuseIdentifier] ?:
      [[MKPinAnnotationView alloc] initWithAnnotation:annotation
                                      reuseIdentifier:reuseIdentifier];
    ((MKPinAnnotationView *)annotationView).animatesDrop = annotation.animateDrop;

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_9_0

    if (![annotationView respondsToSelector:@selector(pinTintColor)]) {
      NSString *hexColor = annotation.tintColor ?
        ABI7_0_0RCTColorToHexString(annotation.tintColor.CGColor) : ABI7_0_0RCTMapPinRed;
      ((MKPinAnnotationView *)annotationView).pinColor =
        [ABI7_0_0RCTConvert MKPinAnnotationColor:hexColor];
    } else

#endif

    {
      ((MKPinAnnotationView *)annotationView).pinTintColor =
        annotation.tintColor ?: [MKPinAnnotationView redPinColor];
    }
  }
  annotationView.canShowCallout = (annotation.title.length > 0);

  if (annotation.leftCalloutViewIndex != NSNotFound &&
      annotation.leftCalloutViewIndex < mapView.ReactABI7_0_0Subviews.count) {
    annotationView.leftCalloutAccessoryView =
      mapView.ReactABI7_0_0Subviews[annotation.leftCalloutViewIndex];
  } else if (annotation.hasLeftCallout) {
    annotationView.leftCalloutAccessoryView =
      [UIButton buttonWithType:UIButtonTypeDetailDisclosure];
  } else {
    annotationView.leftCalloutAccessoryView = nil;
  }

  if (annotation.rightCalloutViewIndex != NSNotFound &&
      annotation.rightCalloutViewIndex < mapView.ReactABI7_0_0Subviews.count) {
    annotationView.rightCalloutAccessoryView =
      mapView.ReactABI7_0_0Subviews[annotation.rightCalloutViewIndex];
  } else if (annotation.hasRightCallout) {
    annotationView.rightCalloutAccessoryView =
      [UIButton buttonWithType:UIButtonTypeDetailDisclosure];
  } else {
    annotationView.rightCalloutAccessoryView = nil;
  }

  //http://stackoverflow.com/questions/32581049/mapkit-ios-9-detailcalloutaccessoryview-usage
  if ([annotationView respondsToSelector:@selector(detailCalloutAccessoryView)]) {
    if (annotation.detailCalloutViewIndex != NSNotFound &&
        annotation.detailCalloutViewIndex < mapView.ReactABI7_0_0Subviews.count) {
      UIView *calloutView = mapView.ReactABI7_0_0Subviews[annotation.detailCalloutViewIndex];
      NSLayoutConstraint *widthConstraint =
        [NSLayoutConstraint constraintWithItem:calloutView
                                     attribute:NSLayoutAttributeWidth
                                     relatedBy:NSLayoutRelationEqual
                                        toItem:nil
                                     attribute:NSLayoutAttributeNotAnAttribute
                                    multiplier:1
                                      constant:calloutView.frame.size.width];
      [calloutView addConstraint:widthConstraint];
      NSLayoutConstraint *heightConstraint =
        [NSLayoutConstraint constraintWithItem:calloutView
                                     attribute:NSLayoutAttributeHeight
                                     relatedBy:NSLayoutRelationEqual
                                        toItem:nil
                                     attribute:NSLayoutAttributeNotAnAttribute
                                    multiplier:1
                                      constant:calloutView.frame.size.height];
      [calloutView addConstraint:heightConstraint];
      annotationView.detailCalloutAccessoryView = calloutView;
    } else {
      annotationView.detailCalloutAccessoryView = nil;
    }
  }

  annotationView.draggable = annotation.draggable;

  return annotationView;
}

- (MKOverlayRenderer *)mapView:(__unused MKMapView *)mapView
            rendererForOverlay:(ABI7_0_0RCTMapOverlay *)overlay
{
  if ([overlay isKindOfClass:[ABI7_0_0RCTMapOverlay class]]) {
    MKPolylineRenderer *polylineRenderer =
      [[MKPolylineRenderer alloc] initWithPolyline:overlay];
    polylineRenderer.strokeColor = overlay.strokeColor;
    polylineRenderer.lineWidth = overlay.lineWidth;
    return polylineRenderer;
  } else {
    return nil;
  }
}

- (void)mapView:(ABI7_0_0RCTMap *)mapView annotationView:(MKAnnotationView *)view
                   calloutAccessoryControlTapped:(UIControl *)control
{
  if (mapView.onPress) {

    // Pass to JS
    ABI7_0_0RCTMapAnnotation *annotation = (ABI7_0_0RCTMapAnnotation *)view.annotation;
    mapView.onPress(@{
      @"side": (control == view.leftCalloutAccessoryView) ? @"left" : @"right",
      @"action": @"callout-click",
      @"annotationId": annotation.identifier
    });
  }
}

- (void)mapView:(ABI7_0_0RCTMap *)mapView didUpdateUserLocation:(MKUserLocation *)location
{
  if (mapView.followUserLocation) {
    MKCoordinateRegion region;
    region.span.latitudeDelta = ABI7_0_0RCTMapDefaultSpan;
    region.span.longitudeDelta = ABI7_0_0RCTMapDefaultSpan;
    region.center = location.coordinate;
    [mapView setRegion:region animated:YES];
  }
}

- (void)mapView:(ABI7_0_0RCTMap *)mapView regionWillChangeAnimated:(__unused BOOL)animated
{
  [self _regionChanged:mapView];

  mapView.regionChangeObserveTimer =
    [NSTimer timerWithTimeInterval:ABI7_0_0RCTMapRegionChangeObserveInterval
                            target:self
                          selector:@selector(_onTick:)
                          userInfo:@{ ABI7_0_0RCTMapViewKey: mapView }
                           repeats:YES];

  [[NSRunLoop mainRunLoop] addTimer:mapView.regionChangeObserveTimer
                            forMode:NSRunLoopCommonModes];
}

- (void)mapView:(ABI7_0_0RCTMap *)mapView regionDidChangeAnimated:(__unused BOOL)animated
{
  [mapView.regionChangeObserveTimer invalidate];
  mapView.regionChangeObserveTimer = nil;

  [self _regionChanged:mapView];

  // Don't send region did change events until map has
  // started rendering, as these won't represent the final location
  if (mapView.hasStartedRendering) {
    [self _emitRegionChangeEvent:mapView continuous:NO];
  };
}

- (void)mapViewWillStartRenderingMap:(ABI7_0_0RCTMap *)mapView
{
  mapView.hasStartedRendering = YES;
  [self _emitRegionChangeEvent:mapView continuous:NO];
}

#pragma mark Private

- (void)_onTick:(NSTimer *)timer
{
  [self _regionChanged:timer.userInfo[ABI7_0_0RCTMapViewKey]];
}

- (void)_regionChanged:(ABI7_0_0RCTMap *)mapView
{
  BOOL needZoom = NO;
  CGFloat newLongitudeDelta = 0.0f;
  MKCoordinateRegion region = mapView.region;

  // On iOS 7, it's possible that we observe invalid locations during
  // initialization of the map. Filter those out.
  if (!CLLocationCoordinate2DIsValid(region.center)) {
    return;
  }

  // Calculation on float is not 100% accurate. If user zoom to max/min and then
  // move, it's likely the map will auto zoom to max/min from time to time.
  // So let's try to make map zoom back to 99% max or 101% min so that there is
  // some buffer, and moving the map won't constantly hit the max/min bound.
  if (mapView.maxDelta > FLT_EPSILON &&
      region.span.longitudeDelta > mapView.maxDelta) {
    needZoom = YES;
    newLongitudeDelta = mapView.maxDelta * (1 - ABI7_0_0RCTMapZoomBoundBuffer);
  } else if (mapView.minDelta > FLT_EPSILON &&
             region.span.longitudeDelta < mapView.minDelta) {
    needZoom = YES;
    newLongitudeDelta = mapView.minDelta * (1 + ABI7_0_0RCTMapZoomBoundBuffer);
  }
  if (needZoom) {
    region.span.latitudeDelta =
      region.span.latitudeDelta / region.span.longitudeDelta * newLongitudeDelta;
    region.span.longitudeDelta = newLongitudeDelta;
    mapView.region = region;
  }

  // Continously observe region changes
  [self _emitRegionChangeEvent:mapView continuous:YES];
}

- (void)_emitRegionChangeEvent:(ABI7_0_0RCTMap *)mapView continuous:(BOOL)continuous
{
  if (mapView.onChange) {
    MKCoordinateRegion region = mapView.region;
    if (!CLLocationCoordinate2DIsValid(region.center)) {
      return;
    }

    mapView.onChange(@{
      @"continuous": @(continuous),
      @"region": @{
        @"latitude": @(ABI7_0_0RCTZeroIfNaN(region.center.latitude)),
        @"longitude": @(ABI7_0_0RCTZeroIfNaN(region.center.longitude)),
        @"latitudeDelta": @(ABI7_0_0RCTZeroIfNaN(region.span.latitudeDelta)),
        @"longitudeDelta": @(ABI7_0_0RCTZeroIfNaN(region.span.longitudeDelta)),
      }
    });
  }
}

@end
