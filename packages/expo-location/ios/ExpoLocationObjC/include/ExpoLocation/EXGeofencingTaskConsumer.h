// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManagerDelegate.h>
#import <ExpoModulesCore/EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

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

@interface EXGeofencingTaskConsumer : NSObject <EXTaskConsumerInterface, CLLocationManagerDelegate>

@property (nonatomic, strong) id<EXTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
