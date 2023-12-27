// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI44_0_0UMTaskManagerInterface/ABI44_0_0UMTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXBackgroundFetchTaskConsumer : NSObject <ABI44_0_0UMTaskConsumerInterface>

@property (nonatomic, strong) id<ABI44_0_0UMTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
