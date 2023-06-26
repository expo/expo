//
// Created by Leland Richardson on 12/27/15.
// Copyright (c) 2015 Facebook. All rights reserved.
//

#import <CoreLocation/CoreLocation.h>
#import <MapKit/MapKit.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>

@interface ABI49_0_0RCTConvert (AirMap)

+ (MKCoordinateSpan)MKCoordinateSpan:(id)json;
+ (MKCoordinateRegion)MKCoordinateRegion:(id)json;
+ (MKMapCamera*)MKMapCamera:(id)json;
+ (MKMapCamera*)MKMapCameraWithDefaults:(id)json existingCamera:(MKMapCamera*)camera;
+ (MKMapType)MKMapType:(id)json;

@end
