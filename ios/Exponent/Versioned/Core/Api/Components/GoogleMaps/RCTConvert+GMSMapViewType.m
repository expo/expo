//
//  RCTConvert+GMSMapViewType.m
//
//  Created by Nick Italiano on 10/23/16.
//

#import "RCTConvert+GMSMapViewType.h"
#import <GoogleMaps/GoogleMaps.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GMSMapViewType)
  RCT_ENUM_CONVERTER(GMSMapViewType,
  (
    @{
      @"standard": @(kGMSTypeNormal),
      @"hybrid": @(kGMSTypeHybrid),
      @"terrain": @(kGMSTypeTerrain),
      @"none": @(kGMSTypeNone)
    }
  ), kGMSTypeTerrain, intValue)
@end
