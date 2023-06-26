// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManagerDelegate.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0EXGeofencingTaskConsumer : NSObject <ABI49_0_0EXTaskConsumerInterface, CLLocationManagerDelegate>

@property (nonatomic, strong) id<ABI49_0_0EXTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
