/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTConvert+MapKit.h"
#import "ABI11_0_0RCTConvert+CoreLocation.h"
#import "ABI11_0_0RCTMapAnnotation.h"
#import "ABI11_0_0RCTMapOverlay.h"

@implementation ABI11_0_0RCTConvert(MapKit)

+ (MKCoordinateSpan)MKCoordinateSpan:(id)json
{
  json = [self NSDictionary:json];
  return (MKCoordinateSpan){
    [self CLLocationDegrees:json[@"latitudeDelta"]],
    [self CLLocationDegrees:json[@"longitudeDelta"]]
  };
}

+ (MKCoordinateRegion)MKCoordinateRegion:(id)json
{
  return (MKCoordinateRegion){
    [self CLLocationCoordinate2D:json],
    [self MKCoordinateSpan:json]
  };
}

ABI11_0_0RCT_ENUM_CONVERTER(MKMapType, (@{
  @"standard": @(MKMapTypeStandard),
  @"satellite": @(MKMapTypeSatellite),
  @"hybrid": @(MKMapTypeHybrid),
}), MKMapTypeStandard, integerValue)

+ (ABI11_0_0RCTMapAnnotation *)ABI11_0_0RCTMapAnnotation:(id)json
{
  json = [self NSDictionary:json];
  ABI11_0_0RCTMapAnnotation *annotation = [ABI11_0_0RCTMapAnnotation new];
  annotation.coordinate = [self CLLocationCoordinate2D:json];
  annotation.draggable = [self BOOL:json[@"draggable"]];
  annotation.title = [self NSString:json[@"title"]];
  annotation.subtitle = [self NSString:json[@"subtitle"]];
  annotation.identifier = [self NSString:json[@"id"]];
  annotation.hasLeftCallout = [self BOOL:json[@"hasLeftCallout"]];
  annotation.hasRightCallout = [self BOOL:json[@"hasRightCallout"]];
  annotation.animateDrop = [self BOOL:json[@"animateDrop"]];
  annotation.tintColor = [self UIColor:json[@"tintColor"]];
  annotation.image = [self UIImage:json[@"image"]];
  annotation.viewIndex =
    [self NSInteger:json[@"viewIndex"] ?: @(NSNotFound)];
  annotation.leftCalloutViewIndex =
    [self NSInteger:json[@"leftCalloutViewIndex"] ?: @(NSNotFound)];
  annotation.rightCalloutViewIndex =
    [self NSInteger:json[@"rightCalloutViewIndex"] ?: @(NSNotFound)];
  annotation.detailCalloutViewIndex =
    [self NSInteger:json[@"detailCalloutViewIndex"] ?: @(NSNotFound)];
  return annotation;
}

ABI11_0_0RCT_ARRAY_CONVERTER(ABI11_0_0RCTMapAnnotation)

+ (ABI11_0_0RCTMapOverlay *)ABI11_0_0RCTMapOverlay:(id)json
{
  json = [self NSDictionary:json];
  NSArray<NSDictionary *> *locations = [self NSDictionaryArray:json[@"coordinates"]];
  CLLocationCoordinate2D coordinates[locations.count];
  NSUInteger index = 0;
  for (NSDictionary *location in locations) {
    coordinates[index++] = [self CLLocationCoordinate2D:location];
  }

  ABI11_0_0RCTMapOverlay *overlay = [ABI11_0_0RCTMapOverlay polylineWithCoordinates:coordinates
                                                            count:locations.count];

  overlay.strokeColor = [self UIColor:json[@"strokeColor"]];
  overlay.identifier = [self NSString:json[@"id"]];
  overlay.lineWidth = [self CGFloat:json[@"lineWidth"] ?: @1];
  return overlay;
}

ABI11_0_0RCT_ARRAY_CONVERTER(ABI11_0_0RCTMapOverlay)

@end
