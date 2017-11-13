//
//  ABI23_0_0RCTConvert+GMSMapViewType.m
//
//  Created by Nick Italiano on 10/23/16.
//

#import "ABI23_0_0RCTConvert+GMSMapViewType.h"
#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>

@implementation ABI23_0_0RCTConvert (GMSMapViewType)
  ABI23_0_0RCT_ENUM_CONVERTER(GMSMapViewType,
  (
    @{
      @"standard": @(kGMSTypeNormal),
      @"hybrid": @(kGMSTypeHybrid),
      @"terrain": @(kGMSTypeTerrain),
      @"none": @(kGMSTypeNone)
    }
  ), kGMSTypeTerrain, intValue)
@end
