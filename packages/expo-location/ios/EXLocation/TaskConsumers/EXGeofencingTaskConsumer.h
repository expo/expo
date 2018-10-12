// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManagerDelegate.h>
#import <EXTaskManagerInterface/EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

// Geofencing event types
extern NSString *const EXGeofencingEventTypeEnter;
extern NSString *const EXGeofencingEventTypeExit;

// Geofencing region states
extern NSString *const EXGeofencingRegionStateUnknown;
extern NSString *const EXGeofencingRegionStateInside;
extern NSString *const EXGeofencingRegionStateOutside;

@interface EXGeofencingTaskConsumer : NSObject <EXTaskConsumerInterface, CLLocationManagerDelegate>

@property (nonatomic, strong) id<EXTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
