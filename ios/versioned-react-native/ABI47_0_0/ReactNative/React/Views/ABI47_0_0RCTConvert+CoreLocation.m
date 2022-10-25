/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTConvert+CoreLocation.h"

@implementation ABI47_0_0RCTConvert (CoreLocation)

ABI47_0_0RCT_CONVERTER(CLLocationDegrees, CLLocationDegrees, doubleValue);
ABI47_0_0RCT_CONVERTER(CLLocationDistance, CLLocationDistance, doubleValue);

+ (CLLocationCoordinate2D)CLLocationCoordinate2D:(id)json
{
  json = [self NSDictionary:json];
  return (CLLocationCoordinate2D){
      [self CLLocationDegrees:json[@"latitude"]], [self CLLocationDegrees:json[@"longitude"]]};
}

@end
