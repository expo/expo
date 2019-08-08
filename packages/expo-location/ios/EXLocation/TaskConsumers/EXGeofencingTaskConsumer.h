// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManagerDelegate.h>
#import <UMTaskManagerInterface/UMTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXGeofencingTaskConsumer : NSObject <UMTaskConsumerInterface, CLLocationManagerDelegate>

@property (nonatomic, strong) id<UMTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
