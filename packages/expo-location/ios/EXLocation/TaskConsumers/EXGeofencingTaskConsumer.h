// Copyright 2018-present 650 Industries. All rights reserved.

#import <CoreLocation/CLLocationManagerDelegate.h>
#import <EXTaskManagerInterface/EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXGeofencingTaskConsumer : NSObject <EXTaskConsumerInterface, CLLocationManagerDelegate>

@property (nonatomic, strong) id<EXTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
