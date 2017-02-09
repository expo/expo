//
// Created by Leland Richardson on 12/27/15.
// Copyright (c) 2015 Facebook. All rights reserved.
//

#import "ABI14_0_0RCTConvert+MoreMapKit.h"

#import <ReactABI14_0_0/ABI14_0_0RCTConvert+CoreLocation.h>
#import "ABI14_0_0AIRMapCoordinate.h"

@implementation ABI14_0_0RCTConvert (MoreMapKit)

// NOTE(lmr):
// This is a bit of a hack, but I'm using this class to simply wrap
// around a `CLLocationCoordinate2D`, since I was unable to figure out
// how to handle an array of structs like CLLocationCoordinate2D. Would love
// to get rid of this if someone can show me how...
+ (ABI14_0_0AIRMapCoordinate *)ABI14_0_0AIRMapCoordinate:(id)json
{
    ABI14_0_0AIRMapCoordinate *coord = [ABI14_0_0AIRMapCoordinate new];
    coord.coordinate = [self CLLocationCoordinate2D:json];
    return coord;
}

ABI14_0_0RCT_ARRAY_CONVERTER(ABI14_0_0AIRMapCoordinate)

+ (NSArray<NSArray<ABI14_0_0AIRMapCoordinate *> *> *)ABI14_0_0AIRMapCoordinateArrayArray:(id)json
{
    return ABI14_0_0RCTConvertArrayValue(@selector(ABI14_0_0AIRMapCoordinateArray:), json);
}

@end
