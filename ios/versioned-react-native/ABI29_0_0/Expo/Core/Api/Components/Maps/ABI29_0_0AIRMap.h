/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import <ReactABI29_0_0/ABI29_0_0RCTComponent.h>
#import "ABI29_0_0SMCalloutView.h"
#import "ABI29_0_0RCTConvert+AirMap.h"

extern const CLLocationDegrees ABI29_0_0AIRMapDefaultSpan;
extern const NSTimeInterval ABI29_0_0AIRMapRegionChangeObserveInterval;
extern const CGFloat ABI29_0_0AIRMapZoomBoundBuffer;
extern const NSInteger ABI29_0_0AIRMapMaxZoomLevel;

@interface ABI29_0_0AIRMap: MKMapView<ABI29_0_0SMCalloutViewDelegate>

@property (nonatomic, strong) ABI29_0_0SMCalloutView *calloutView;
@property (nonatomic, strong) UIImageView *cacheImageView;
@property (nonatomic, strong) UIView *loadingView;

@property (nonatomic, copy) NSString *userLocationAnnotationTitle;
@property (nonatomic, assign) BOOL followUserLocation;
@property (nonatomic, assign) BOOL hasStartedRendering;
@property (nonatomic, assign) BOOL cacheEnabled;
@property (nonatomic, assign) BOOL loadingEnabled;
@property (nonatomic, strong) UIColor *loadingBackgroundColor;
@property (nonatomic, strong) UIColor *loadingIndicatorColor;
@property (nonatomic, assign) BOOL hasShownInitialLoading;
@property (nonatomic, assign) CGFloat minDelta;
@property (nonatomic, assign) CGFloat maxDelta;
@property (nonatomic, assign) UIEdgeInsets legalLabelInsets;
@property (nonatomic, strong) NSTimer *regionChangeObserveTimer;
@property (nonatomic, assign) MKCoordinateRegion initialRegion;
@property (nonatomic, assign) CGFloat minZoomLevel;
@property (nonatomic, assign) CGFloat maxZoomLevel;

@property (nonatomic, assign) CLLocationCoordinate2D pendingCenter;
@property (nonatomic, assign) MKCoordinateSpan pendingSpan;


@property (nonatomic, assign) BOOL ignoreRegionChanges;

@property (nonatomic, copy) ABI29_0_0RCTBubblingEventBlock onMapReady;
@property (nonatomic, copy) ABI29_0_0RCTBubblingEventBlock onChange;
@property (nonatomic, copy) ABI29_0_0RCTBubblingEventBlock onPress;
@property (nonatomic, copy) ABI29_0_0RCTBubblingEventBlock onPanDrag;
@property (nonatomic, copy) ABI29_0_0RCTBubblingEventBlock onLongPress;
@property (nonatomic, copy) ABI29_0_0RCTDirectEventBlock onMarkerPress;
@property (nonatomic, copy) ABI29_0_0RCTDirectEventBlock onMarkerSelect;
@property (nonatomic, copy) ABI29_0_0RCTDirectEventBlock onMarkerDeselect;
@property (nonatomic, copy) ABI29_0_0RCTDirectEventBlock onMarkerDragStart;
@property (nonatomic, copy) ABI29_0_0RCTDirectEventBlock onMarkerDrag;
@property (nonatomic, copy) ABI29_0_0RCTDirectEventBlock onMarkerDragEnd;
@property (nonatomic, copy) ABI29_0_0RCTDirectEventBlock onCalloutPress;
@property (nonatomic, copy) ABI29_0_0RCTDirectEventBlock onRegionChange;

- (void)cacheViewIfNeeded;
- (void)beginLoading;
- (void)finishLoading;

@end
