// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>
#import <CoreLocation/CLLocationManager.h>

#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMExportedModule.h>
#import <UMCore/UMAppLifecycleListener.h>
#import <UMCore/UMModuleRegistryConsumer.h>

// Location accuracies
typedef NS_ENUM(NSUInteger, EXLocationAccuracy) {
  EXLocationAccuracyLowest = 1,
  EXLocationAccuracyLow = 2,
  EXLocationAccuracyBalanced = 3,
  EXLocationAccuracyHigh = 4,
  EXLocationAccuracyHighest = 5,
  EXLocationAccuracyBestForNavigation = 6,
};

// Geofencing event types
typedef NS_ENUM(NSUInteger, EXGeofencingEventType) {
  EXGeofencingEventTypeEnter = 1,
  EXGeofencingEventTypeExit = 2,
};

// Geofencing region states
typedef NS_ENUM(NSUInteger, EXGeofencingRegionState) {
  EXGeofencingRegionStateUnknown = 0,
  EXGeofencingRegionStateInside = 1,
  EXGeofencingRegionStateOutside = 2,
};

@interface EXLocation : UMExportedModule <UMAppLifecycleListener, UMEventEmitter, UMModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;
+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(EXLocationAccuracy)accuracy;
+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType;

@end
