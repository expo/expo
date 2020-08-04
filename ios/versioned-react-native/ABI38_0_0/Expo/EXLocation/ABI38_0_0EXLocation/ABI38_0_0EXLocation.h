// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>
#import <CoreLocation/CLLocationManager.h>

#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitter.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMAppLifecycleListener.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

// Location accuracies
typedef NS_ENUM(NSUInteger, ABI38_0_0EXLocationAccuracy) {
  ABI38_0_0EXLocationAccuracyLowest = 1,
  ABI38_0_0EXLocationAccuracyLow = 2,
  ABI38_0_0EXLocationAccuracyBalanced = 3,
  ABI38_0_0EXLocationAccuracyHigh = 4,
  ABI38_0_0EXLocationAccuracyHighest = 5,
  ABI38_0_0EXLocationAccuracyBestForNavigation = 6,
};

// Geofencing event types
typedef NS_ENUM(NSUInteger, ABI38_0_0EXGeofencingEventType) {
  ABI38_0_0EXGeofencingEventTypeEnter = 1,
  ABI38_0_0EXGeofencingEventTypeExit = 2,
};

// Geofencing region states
typedef NS_ENUM(NSUInteger, ABI38_0_0EXGeofencingRegionState) {
  ABI38_0_0EXGeofencingRegionStateUnknown = 0,
  ABI38_0_0EXGeofencingRegionStateInside = 1,
  ABI38_0_0EXGeofencingRegionStateOutside = 2,
};

@interface ABI38_0_0EXLocation : ABI38_0_0UMExportedModule <ABI38_0_0UMAppLifecycleListener, ABI38_0_0UMEventEmitter, ABI38_0_0UMModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;
+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(ABI38_0_0EXLocationAccuracy)accuracy;
+ (CLActivityType)CLActivityTypeFromOption:(NSInteger)activityType;

@end
