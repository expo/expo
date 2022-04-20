// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManagerDelegate.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXGeofencingTaskConsumer : NSObject <ABI45_0_0EXTaskConsumerInterface, CLLocationManagerDelegate>

@property (nonatomic, strong) id<ABI45_0_0EXTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
