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

#import <ReactABI15_0_0/ABI15_0_0RCTComponent.h>
#import <ReactABI15_0_0/ABI15_0_0RCTConvert+MapKit.h>

ABI15_0_0RCT_EXTERN const CLLocationDegrees ABI15_0_0RCTMapDefaultSpan;
ABI15_0_0RCT_EXTERN const NSTimeInterval ABI15_0_0RCTMapRegionChangeObserveInterval;
ABI15_0_0RCT_EXTERN const CGFloat ABI15_0_0RCTMapZoomBoundBuffer;

@interface ABI15_0_0RCTMap: MKMapView

@property (nonatomic, assign) BOOL followUserLocation;
@property (nonatomic, assign) BOOL hasStartedRendering;
@property (nonatomic, assign) BOOL showsAnnotationCallouts;
@property (nonatomic, assign) CGFloat minDelta;
@property (nonatomic, assign) CGFloat maxDelta;
@property (nonatomic, assign) UIEdgeInsets legalLabelInsets;
@property (nonatomic, strong) NSTimer *regionChangeObserveTimer;
@property (nonatomic, copy) NSArray<NSString *> *annotationIDs;
@property (nonatomic, copy) NSArray<NSString *> *overlayIDs;

@property (nonatomic, copy) ABI15_0_0RCTBubblingEventBlock onChange;
@property (nonatomic, copy) ABI15_0_0RCTBubblingEventBlock onPress;
@property (nonatomic, copy) ABI15_0_0RCTBubblingEventBlock onAnnotationDragStateChange;
@property (nonatomic, copy) ABI15_0_0RCTBubblingEventBlock onAnnotationFocus;
@property (nonatomic, copy) ABI15_0_0RCTBubblingEventBlock onAnnotationBlur;

- (void)setAnnotations:(NSArray<ABI15_0_0RCTMapAnnotation *> *)annotations;
- (void)setOverlays:(NSArray<ABI15_0_0RCTMapOverlay *> *)overlays;

@end
