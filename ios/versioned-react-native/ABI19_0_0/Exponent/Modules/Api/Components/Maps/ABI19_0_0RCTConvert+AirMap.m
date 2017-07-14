//
// Created by Leland Richardson on 12/27/15.
// Copyright (c) 2015 Facebook. All rights reserved.
//

#import "ABI19_0_0RCTConvert+AirMap.h"

#import <ReactABI19_0_0/ABI19_0_0RCTConvert+CoreLocation.h>
#import "ABI19_0_0AIRMapCoordinate.h"

@implementation ABI19_0_0RCTConvert (AirMap)

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

ABI19_0_0RCT_ENUM_CONVERTER(MKMapType, (@{
  @"standard": @(MKMapTypeStandard),
  @"satellite": @(MKMapTypeSatellite),
  @"hybrid": @(MKMapTypeHybrid),
}), MKMapTypeStandard, integerValue)

// NOTE(lmr):
// This is a bit of a hack, but I'm using this class to simply wrap
// around a `CLLocationCoordinate2D`, since I was unable to figure out
// how to handle an array of structs like CLLocationCoordinate2D. Would love
// to get rid of this if someone can show me how...
+ (ABI19_0_0AIRMapCoordinate *)ABI19_0_0AIRMapCoordinate:(id)json
{
    ABI19_0_0AIRMapCoordinate *coord = [ABI19_0_0AIRMapCoordinate new];
    coord.coordinate = [self CLLocationCoordinate2D:json];
    return coord;
}

ABI19_0_0RCT_ARRAY_CONVERTER(ABI19_0_0AIRMapCoordinate)

+ (NSArray<NSArray<ABI19_0_0AIRMapCoordinate *> *> *)ABI19_0_0AIRMapCoordinateArrayArray:(id)json
{
    return ABI19_0_0RCTConvertArrayValue(@selector(ABI19_0_0AIRMapCoordinateArray:), json);
}

@end
