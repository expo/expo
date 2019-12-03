// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManagerDelegate.h>
#import <ABI34_0_0UMTaskManagerInterface/ABI34_0_0UMTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI34_0_0EXGeofencingTaskConsumer : NSObject <ABI34_0_0UMTaskConsumerInterface, CLLocationManagerDelegate>

@property (nonatomic, strong) id<ABI34_0_0UMTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
