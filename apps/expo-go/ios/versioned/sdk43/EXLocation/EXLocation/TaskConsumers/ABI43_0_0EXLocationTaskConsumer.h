// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManagerDelegate.h>
#import <ABI43_0_0UMTaskManagerInterface/ABI43_0_0UMTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXLocationTaskConsumer : NSObject <ABI43_0_0UMTaskConsumerInterface, CLLocationManagerDelegate>

@property (nonatomic, strong) id<ABI43_0_0UMTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
