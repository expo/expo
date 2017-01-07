/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <MapKit/MapKit.h>

#import <ReactABI13_0_0/ABI13_0_0RCTConvert.h>

@class ABI13_0_0RCTMapAnnotation;
@class ABI13_0_0RCTMapOverlay;

@interface ABI13_0_0RCTConvert (MapKit)

+ (MKCoordinateSpan)MKCoordinateSpan:(id)json;
+ (MKCoordinateRegion)MKCoordinateRegion:(id)json;
+ (MKMapType)MKMapType:(id)json;

+ (ABI13_0_0RCTMapAnnotation *)ABI13_0_0RCTMapAnnotation:(id)json;
+ (ABI13_0_0RCTMapOverlay *)ABI13_0_0RCTMapOverlay:(id)json;

+ (NSArray<ABI13_0_0RCTMapAnnotation *> *)ABI13_0_0RCTMapAnnotationArray:(id)json;
+ (NSArray<ABI13_0_0RCTMapOverlay *> *)ABI13_0_0RCTMapOverlayArray:(id)json;

@end
