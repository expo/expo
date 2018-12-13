// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXTaskManagerInterface/EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXBackgroundFetchTaskConsumer : NSObject <EXTaskConsumerInterface>

@property (nonatomic, strong) id<EXTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
