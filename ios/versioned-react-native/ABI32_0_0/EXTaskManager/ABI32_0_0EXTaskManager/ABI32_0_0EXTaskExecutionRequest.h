// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXTaskManagerInterface/ABI32_0_0EXTaskInterface.h>
#import <ABI32_0_0EXAppLoaderProvider/ABI32_0_0EXAppRecordInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI32_0_0EXTaskExecutionRequest : NSObject

@property (nonatomic, strong) void(^callback)(NSArray * _Nonnull results);

- (instancetype)initWithCallback:(void(^)(NSArray * _Nonnull results))callback;

- (void)addTask:(nonnull id<ABI32_0_0EXTaskInterface>)task;
- (void)task:(nonnull id<ABI32_0_0EXTaskInterface>)task didFinishWithResult:(id)result;
- (BOOL)isIncludingTask:(nullable id<ABI32_0_0EXTaskInterface>)task;
- (void)maybeEvaluate;

@end

NS_ASSUME_NONNULL_END
