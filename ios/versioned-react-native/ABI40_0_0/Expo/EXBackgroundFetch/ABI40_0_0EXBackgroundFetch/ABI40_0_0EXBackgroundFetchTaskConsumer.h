// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0UMTaskManagerInterface/ABI40_0_0UMTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXBackgroundFetchTaskConsumer : NSObject <ABI40_0_0UMTaskConsumerInterface>

@property (nonatomic, strong) id<ABI40_0_0UMTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
