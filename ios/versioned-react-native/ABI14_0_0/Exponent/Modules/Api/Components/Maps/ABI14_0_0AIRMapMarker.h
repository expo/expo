/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0AIRMapMarker.h"
#import "ABI14_0_0AIRMapCallout.h"

#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import <ReactABI14_0_0/ABI14_0_0RCTConvert+MapKit.h>
#import <ReactABI14_0_0/ABI14_0_0RCTComponent.h>
#import "ABI14_0_0AIRMap.h"
#import "ABI14_0_0SMCalloutView.h"

@class ABI14_0_0RCTBridge;

@interface ABI14_0_0AIRMapMarker : MKAnnotationView <MKAnnotation>

@property (nonatomic, strong) ABI14_0_0AIRMapCallout *calloutView;
@property (nonatomic, weak) ABI14_0_0AIRMap *map;
@property (nonatomic, weak) ABI14_0_0RCTBridge *bridge;

@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) NSString *imageSrc;
@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) NSString *subtitle;
@property (nonatomic, assign) CLLocationCoordinate2D coordinate;
@property (nonatomic, strong) UIColor *pinColor;
@property (nonatomic, assign) NSInteger zIndex;

@property (nonatomic, copy) ABI14_0_0RCTBubblingEventBlock onPress;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onSelect;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onDeselect;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onCalloutPress;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onDragStart;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onDrag;
@property (nonatomic, copy) ABI14_0_0RCTDirectEventBlock onDragEnd;


- (MKAnnotationView *)getAnnotationView;
- (void)fillCalloutView:(ABI14_0_0SMCalloutView *)calloutView;
- (BOOL)shouldShowCalloutView;
- (void)showCalloutView;
- (void)hideCalloutView;

@end


@interface ABI14_0_0AIREmptyCalloutBackgroundView : ABI14_0_0SMCalloutBackgroundView
@end
