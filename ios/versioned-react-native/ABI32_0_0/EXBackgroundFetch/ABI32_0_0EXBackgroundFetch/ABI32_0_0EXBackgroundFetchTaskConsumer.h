// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXTaskManagerInterface/ABI32_0_0EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI32_0_0EXBackgroundFetchTaskConsumer : NSObject <ABI32_0_0EXTaskConsumerInterface>

@property (nonatomic, strong) id<ABI32_0_0EXTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
