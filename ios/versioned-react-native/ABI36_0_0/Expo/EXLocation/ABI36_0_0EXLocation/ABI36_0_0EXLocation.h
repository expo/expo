// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>
#import <CoreLocation/CLLocationManager.h>

#import <ABI36_0_0UMCore/ABI36_0_0UMEventEmitter.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMAppLifecycleListener.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>

// Location accuracies
typedef NS_ENUM(NSUInteger, ABI36_0_0EXLocationAccuracy) {
  ABI36_0_0EXLocationAccuracyLowest = 1,
  ABI36_0_0EXLocationAccuracyLow = 2,
  ABI36_0_0EXLocationAccuracyBalanced = 3,
  ABI36_0_0EXLocationAccuracyHigh = 4,
  ABI36_0_0EXLocationAccuracyHighest = 5,
  ABI36_0_0EXLocationAccuracyBestForNavigation = 6,
};

// Geofencing event types
typedef NS_ENUM(NSUInteger, ABI36_0_0EXGeofencingEventType) {
  ABI36_0_0EXGeofencingEventTypeEnter = 1,
  ABI36_0_0EXGeofencingEventTypeExit = 2,
};

// Geofencing region states
typedef NS_ENUM(NSUInteger, ABI36_0_0EXGeofencingRegionState) {
  ABI36_0_0EXGeofencingRegionStateUnknown = 0,
  ABI36_0_0EXGeofencingRegionStateInside = 1,
  ABI36_0_0EXGeofencingRegionStateOutside = 2,
};

@interface ABI36_0_0EXLocation : ABI36_0_0UMExportedModule <ABI36_0_0UMAppLifecycleListener, ABI36_0_0UMEventEmitter, ABI36_0_0UMModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;
+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(ABI36_0_0EXLocationAccuracy)accuracy;
+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType;

@end
