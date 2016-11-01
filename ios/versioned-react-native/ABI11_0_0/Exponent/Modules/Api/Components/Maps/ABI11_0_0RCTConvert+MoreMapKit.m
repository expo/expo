//
// Created by Leland Richardson on 12/27/15.
// Copyright (c) 2015 Facebook. All rights reserved.
//

#import "ABI11_0_0RCTConvert+MoreMapKit.h"
#import "ABI11_0_0AIRMapCoordinate.h"
#import "ABI11_0_0RCTConvert+CoreLocation.h"


@implementation ABI11_0_0RCTConvert (MoreMapKit)

// NOTE(lmr):
// This is a bit of a hack, but I'm using this class to simply wrap
// around a `CLLocationCoordinate2D`, since I was unable to figure out
// how to handle an array of structs like CLLocationCoordinate2D. Would love
// to get rid of this if someone can show me how...
+ (ABI11_0_0AIRMapCoordinate *)ABI11_0_0AIRMapCoordinate:(id)json
{
    ABI11_0_0AIRMapCoordinate *coord = [ABI11_0_0AIRMapCoordinate new];
    coord.coordinate = [self CLLocationCoordinate2D:json];
    return coord;
}

ABI11_0_0RCT_ARRAY_CONVERTER(ABI11_0_0AIRMapCoordinate)

@end
