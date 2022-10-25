// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXTaskConsumerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXBackgroundFetchTaskConsumer : NSObject <ABI47_0_0EXTaskConsumerInterface>

@property (nonatomic, strong) id<ABI47_0_0EXTaskInterface> task;

@end

NS_ASSUME_NONNULL_END
