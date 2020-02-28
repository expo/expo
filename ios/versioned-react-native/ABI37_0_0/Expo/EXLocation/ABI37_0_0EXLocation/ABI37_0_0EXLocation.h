// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>
#import <CoreLocation/CLLocationManager.h>

#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitter.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppLifecycleListener.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>

// Location accuracies
typedef NS_ENUM(NSUInteger, ABI37_0_0EXLocationAccuracy) {
  ABI37_0_0EXLocationAccuracyLowest = 1,
  ABI37_0_0EXLocationAccuracyLow = 2,
  ABI37_0_0EXLocationAccuracyBalanced = 3,
  ABI37_0_0EXLocationAccuracyHigh = 4,
  ABI37_0_0EXLocationAccuracyHighest = 5,
  ABI37_0_0EXLocationAccuracyBestForNavigation = 6,
};

// Geofencing event types
typedef NS_ENUM(NSUInteger, ABI37_0_0EXGeofencingEventType) {
  ABI37_0_0EXGeofencingEventTypeEnter = 1,
  ABI37_0_0EXGeofencingEventTypeExit = 2,
};

// Geofencing region states
typedef NS_ENUM(NSUInteger, ABI37_0_0EXGeofencingRegionState) {
  ABI37_0_0EXGeofencingRegionStateUnknown = 0,
  ABI37_0_0EXGeofencingRegionStateInside = 1,
  ABI37_0_0EXGeofencingRegionStateOutside = 2,
};

@interface ABI37_0_0EXLocation : ABI37_0_0UMExportedModule <ABI37_0_0UMAppLifecycleListener, ABI37_0_0UMEventEmitter, ABI37_0_0UMModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;
+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(ABI37_0_0EXLocationAccuracy)accuracy;
+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType;

@end
