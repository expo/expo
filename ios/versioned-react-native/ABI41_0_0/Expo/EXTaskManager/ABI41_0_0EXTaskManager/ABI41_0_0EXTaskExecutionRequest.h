// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0UMTaskManagerInterface/ABI41_0_0UMTaskInterface.h>
#import <ABI41_0_0UMAppLoader/ABI41_0_0UMAppLoaderInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXTaskExecutionRequest : NSObject

@property (nonatomic, strong) void(^callback)(NSArray * _Nonnull results);

- (instancetype)initWithCallback:(void(^)(NSArray * _Nonnull results))callback;

- (void)addTask:(nonnull id<ABI41_0_0UMTaskInterface>)task;
- (void)task:(nonnull id<ABI41_0_0UMTaskInterface>)task didFinishWithResult:(id)result;
- (BOOL)isIncludingTask:(nullable id<ABI41_0_0UMTaskInterface>)task;
- (void)maybeEvaluate;

@end

NS_ASSUME_NONNULL_END
