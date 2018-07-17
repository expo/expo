/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreLocation/CoreLocation.h>

#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>

@interface ABI29_0_0RCTConvert (CoreLocation)

+ (CLLocationDegrees)CLLocationDegrees:(id)json;
+ (CLLocationDistance)CLLocationDistance:(id)json;
+ (CLLocationCoordinate2D)CLLocationCoordinate2D:(id)json;

@end
