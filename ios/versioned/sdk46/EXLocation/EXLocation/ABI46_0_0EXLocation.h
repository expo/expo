// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>
#import <CoreLocation/CLLocationManager.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>

// Location accuracies
typedef NS_ENUM(NSUInteger, ABI46_0_0EXLocationAccuracy) {
  ABI46_0_0EXLocationAccuracyLowest = 1,
  ABI46_0_0EXLocationAccuracyLow = 2,
  ABI46_0_0EXLocationAccuracyBalanced = 3,
  ABI46_0_0EXLocationAccuracyHigh = 4,
  ABI46_0_0EXLocationAccuracyHighest = 5,
  ABI46_0_0EXLocationAccuracyBestForNavigation = 6,
};

// Geofencing event types
typedef NS_ENUM(NSUInteger, ABI46_0_0EXGeofencingEventType) {
  ABI46_0_0EXGeofencingEventTypeEnter = 1,
  ABI46_0_0EXGeofencingEventTypeExit = 2,
};

// Geofencing region states
typedef NS_ENUM(NSUInteger, ABI46_0_0EXGeofencingRegionState) {
  ABI46_0_0EXGeofencingRegionStateUnknown = 0,
  ABI46_0_0EXGeofencingRegionStateInside = 1,
  ABI46_0_0EXGeofencingRegionStateOutside = 2,
};

@interface ABI46_0_0EXLocation : ABI46_0_0EXExportedModule <ABI46_0_0EXEventEmitter, ABI46_0_0EXModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;
+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(ABI46_0_0EXLocationAccuracy)accuracy;
+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType;

@end
