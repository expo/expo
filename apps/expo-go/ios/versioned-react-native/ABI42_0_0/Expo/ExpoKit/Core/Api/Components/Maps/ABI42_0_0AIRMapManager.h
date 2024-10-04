/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import "ABI42_0_0AIRMap.h"

#define MERCATOR_RADIUS 85445659.44705395
#define MERCATOR_OFFSET 268435456

@interface ABI42_0_0AIRMapManager : ABI42_0_0RCTViewManager


- (void)setCenterCoordinate:(CLLocationCoordinate2D)centerCoordinate
    zoomLevel:(double)zoomLevel
    animated:(BOOL)animated
    mapView:(ABI42_0_0AIRMap *)mapView;

- (MKCoordinateRegion)coordinateRegionWithMapView:(ABI42_0_0AIRMap *)mapView
                                 centerCoordinate:(CLLocationCoordinate2D)centerCoordinate
								                     andZoomLevel:(double)zoomLevel;
- (double) zoomLevel:(ABI42_0_0AIRMap *)mapView;

@end
