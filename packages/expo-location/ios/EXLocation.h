// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>
#import <CoreLocation/CLLocationManager.h>

// Location accuracies
typedef NS_ENUM(NSUInteger, EXLocationAccuracy) {
  EXLocationAccuracyLowest = 1,
  EXLocationAccuracyLow = 2,
  EXLocationAccuracyBalanced = 3,
  EXLocationAccuracyHigh = 4,
  EXLocationAccuracyHighest = 5,
  EXLocationAccuracyBestForNavigation = 6,
};

@interface EXLocation : NSObject

+ (NSDictionary *)exportLocation:(CLLocation *)location;
+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(EXLocationAccuracy)accuracy;
+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType;

@end
