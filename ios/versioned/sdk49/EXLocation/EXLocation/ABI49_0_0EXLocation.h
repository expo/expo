// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>
#import <CoreLocation/CLLocationManager.h>

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXEventEmitter.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>

// Location accuracies
typedef NS_ENUM(NSUInteger, ABI49_0_0EXLocationAccuracy) {
  ABI49_0_0EXLocationAccuracyLowest = 1,
  ABI49_0_0EXLocationAccuracyLow = 2,
  ABI49_0_0EXLocationAccuracyBalanced = 3,
  ABI49_0_0EXLocationAccuracyHigh = 4,
  ABI49_0_0EXLocationAccuracyHighest = 5,
  ABI49_0_0EXLocationAccuracyBestForNavigation = 6,
};

// Geofencing event types
typedef NS_ENUM(NSUInteger, ABI49_0_0EXGeofencingEventType) {
  ABI49_0_0EXGeofencingEventTypeEnter = 1,
  ABI49_0_0EXGeofencingEventTypeExit = 2,
};

// Geofencing region states
typedef NS_ENUM(NSUInteger, ABI49_0_0EXGeofencingRegionState) {
  ABI49_0_0EXGeofencingRegionStateUnknown = 0,
  ABI49_0_0EXGeofencingRegionStateInside = 1,
  ABI49_0_0EXGeofencingRegionStateOutside = 2,
};

@interface ABI49_0_0EXLocation : ABI49_0_0EXExportedModule <ABI49_0_0EXEventEmitter, ABI49_0_0EXModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;
+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(ABI49_0_0EXLocationAccuracy)accuracy;
+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType;

@end
