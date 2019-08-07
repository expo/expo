// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>
#import <CoreLocation/CLLocationManager.h>

#import <ABI33_0_0UMCore/ABI33_0_0UMEventEmitter.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMAppLifecycleListener.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

// Location accuracies
typedef NS_ENUM(NSUInteger, ABI33_0_0EXLocationAccuracy) {
  ABI33_0_0EXLocationAccuracyLowest = 1,
  ABI33_0_0EXLocationAccuracyLow = 2,
  ABI33_0_0EXLocationAccuracyBalanced = 3,
  ABI33_0_0EXLocationAccuracyHigh = 4,
  ABI33_0_0EXLocationAccuracyHighest = 5,
  ABI33_0_0EXLocationAccuracyBestForNavigation = 6,
};

// Geofencing event types
typedef NS_ENUM(NSUInteger, ABI33_0_0EXGeofencingEventType) {
  ABI33_0_0EXGeofencingEventTypeEnter = 1,
  ABI33_0_0EXGeofencingEventTypeExit = 2,
};

// Geofencing region states
typedef NS_ENUM(NSUInteger, ABI33_0_0EXGeofencingRegionState) {
  ABI33_0_0EXGeofencingRegionStateUnknown = 0,
  ABI33_0_0EXGeofencingRegionStateInside = 1,
  ABI33_0_0EXGeofencingRegionStateOutside = 2,
};

@interface ABI33_0_0EXLocation : ABI33_0_0UMExportedModule <ABI33_0_0UMAppLifecycleListener, ABI33_0_0UMEventEmitter, ABI33_0_0UMModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;
+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(ABI33_0_0EXLocationAccuracy)accuracy;
+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType;

@end
