// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>
#import <CoreLocation/CLLocationManager.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXEventEmitter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>

// Location accuracies
typedef NS_ENUM(NSUInteger, ABI45_0_0EXLocationAccuracy) {
  ABI45_0_0EXLocationAccuracyLowest = 1,
  ABI45_0_0EXLocationAccuracyLow = 2,
  ABI45_0_0EXLocationAccuracyBalanced = 3,
  ABI45_0_0EXLocationAccuracyHigh = 4,
  ABI45_0_0EXLocationAccuracyHighest = 5,
  ABI45_0_0EXLocationAccuracyBestForNavigation = 6,
};

// Geofencing event types
typedef NS_ENUM(NSUInteger, ABI45_0_0EXGeofencingEventType) {
  ABI45_0_0EXGeofencingEventTypeEnter = 1,
  ABI45_0_0EXGeofencingEventTypeExit = 2,
};

// Geofencing region states
typedef NS_ENUM(NSUInteger, ABI45_0_0EXGeofencingRegionState) {
  ABI45_0_0EXGeofencingRegionStateUnknown = 0,
  ABI45_0_0EXGeofencingRegionStateInside = 1,
  ABI45_0_0EXGeofencingRegionStateOutside = 2,
};

@interface ABI45_0_0EXLocation : ABI45_0_0EXExportedModule <ABI45_0_0EXEventEmitter, ABI45_0_0EXModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;
+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(ABI45_0_0EXLocationAccuracy)accuracy;
+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType;

@end
