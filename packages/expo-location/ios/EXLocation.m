// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoLocation/EXLocation.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXLocation

+ (NSDictionary *)exportLocation:(CLLocation *)location
{
  BOOL hasAltitude = location.verticalAccuracy >= 0;
  return @{
    @"coords": @{
        @"latitude": @(location.coordinate.latitude),
        @"longitude": @(location.coordinate.longitude),
        @"altitude": hasAltitude ? @(location.ellipsoidalAltitude) : [NSNull null],
        @"altitudeAboveMeanSeaLevel": hasAltitude ? @(location.altitude) : [NSNull null],
        @"accuracy": @(location.horizontalAccuracy),
        @"altitudeAccuracy": hasAltitude ? @(location.verticalAccuracy) : [NSNull null],
        @"heading": @(location.course),
        @"speed": @(location.speed),
        },
    @"timestamp": @([location.timestamp timeIntervalSince1970] * 1000),
    @"mocked": @(location.sourceInformation.isSimulatedBySoftware),
    };
}

+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(EXLocationAccuracy)accuracy
{
  switch (accuracy) {
    case EXLocationAccuracyLowest:
      return kCLLocationAccuracyThreeKilometers;
    case EXLocationAccuracyLow:
      return kCLLocationAccuracyKilometer;
    case EXLocationAccuracyBalanced:
      return kCLLocationAccuracyHundredMeters;
    case EXLocationAccuracyHigh:
      return kCLLocationAccuracyNearestTenMeters;
    case EXLocationAccuracyHighest:
      return kCLLocationAccuracyBest;
    case EXLocationAccuracyBestForNavigation:
      return kCLLocationAccuracyBestForNavigation;
    default:
      return kCLLocationAccuracyHundredMeters;
  }
}

+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType
{
  if (activityType >= CLActivityTypeOther && activityType <= CLActivityTypeOtherNavigation) {
    return activityType;
  }
  if (activityType == CLActivityTypeAirborne) {
    return activityType;
  }
  return CLActivityTypeOther;
}

@end

NS_ASSUME_NONNULL_END
