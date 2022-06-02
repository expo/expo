// Copyright 2021-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXBackgroundRemoteNotificationConsumer : NSObject <ABI45_0_0EXTaskConsumerInterface>

@property (nonatomic, strong) id<ABI45_0_0EXTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
