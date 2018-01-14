//
//  ABI25_0_0RCTConvert+GMSMapViewType.m
//
//  Created by Nick Italiano on 10/23/16.
//

#import "ABI25_0_0RCTConvert+GMSMapViewType.h"
#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI25_0_0/ABI25_0_0RCTConvert.h>

@implementation ABI25_0_0RCTConvert (GMSMapViewType)
  ABI25_0_0RCT_ENUM_CONVERTER(GMSMapViewType,
  (
    @{
      @"standard": @(kGMSTypeNormal),
      @"hybrid": @(kGMSTypeHybrid),
      @"terrain": @(kGMSTypeTerrain),
      @"none": @(kGMSTypeNone)
    }
  ), kGMSTypeTerrain, intValue)
@end
