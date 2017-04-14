//
// Created by Leland Richardson on 12/27/15.
// Copyright (c) 2015 Facebook. All rights reserved.
//

#import "ABI16_0_0RCTConvert+MoreMapKit.h"

#import <ReactABI16_0_0/ABI16_0_0RCTConvert+CoreLocation.h>
#import "ABI16_0_0AIRMapCoordinate.h"

@implementation ABI16_0_0RCTConvert (MoreMapKit)

// NOTE(lmr):
// This is a bit of a hack, but I'm using this class to simply wrap
// around a `CLLocationCoordinate2D`, since I was unable to figure out
// how to handle an array of structs like CLLocationCoordinate2D. Would love
// to get rid of this if someone can show me how...
+ (ABI16_0_0AIRMapCoordinate *)ABI16_0_0AIRMapCoordinate:(id)json
{
    ABI16_0_0AIRMapCoordinate *coord = [ABI16_0_0AIRMapCoordinate new];
    coord.coordinate = [self CLLocationCoordinate2D:json];
    return coord;
}

ABI16_0_0RCT_ARRAY_CONVERTER(ABI16_0_0AIRMapCoordinate)

+ (NSArray<NSArray<ABI16_0_0AIRMapCoordinate *> *> *)ABI16_0_0AIRMapCoordinateArrayArray:(id)json
{
    return ABI16_0_0RCTConvertArrayValue(@selector(ABI16_0_0AIRMapCoordinateArray:), json);
}

@end
