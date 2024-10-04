// Copyright 2021-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXBackgroundRemoteNotificationConsumer : NSObject <EXTaskConsumerInterface>

@property (nonatomic, strong) id<EXTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
