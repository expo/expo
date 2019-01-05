// Copyright 2015-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocation.h>

#import <ABI32_0_0EXCore/ABI32_0_0EXEventEmitter.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXAppLifecycleListener.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>

// Location accuracies
typedef NS_ENUM(NSUInteger, ABI32_0_0EXLocationAccuracy) {
  ABI32_0_0EXLocationAccuracyLowest = 1,
  ABI32_0_0EXLocationAccuracyLow = 2,
  ABI32_0_0EXLocationAccuracyBalanced = 3,
  ABI32_0_0EXLocationAccuracyHigh = 4,
  ABI32_0_0EXLocationAccuracyHighest = 5,
  ABI32_0_0EXLocationAccuracyBestForNavigation = 6,
};

// Geofencing event types
typedef NS_ENUM(NSUInteger, ABI32_0_0EXGeofencingEventType) {
  ABI32_0_0EXGeofencingEventTypeEnter = 1,
  ABI32_0_0EXGeofencingEventTypeExit = 2,
};

// Geofencing region states
typedef NS_ENUM(NSUInteger, ABI32_0_0EXGeofencingRegionState) {
  ABI32_0_0EXGeofencingRegionStateUnknown = 0,
  ABI32_0_0EXGeofencingRegionStateInside = 1,
  ABI32_0_0EXGeofencingRegionStateOutside = 2,
};

@interface ABI32_0_0EXLocation : ABI32_0_0EXExportedModule <ABI32_0_0EXAppLifecycleListener, ABI32_0_0EXEventEmitter, ABI32_0_0EXModuleRegistryConsumer>

+ (NSDictionary *)exportLocation:(CLLocation *)location;
+ (CLLocationAccuracy)CLLocationAccuracyFromOption:(ABI32_0_0EXLocationAccuracy)accuracy;

@end
