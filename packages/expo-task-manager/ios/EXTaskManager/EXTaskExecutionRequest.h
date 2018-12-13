// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXTaskManagerInterface/EXTaskInterface.h>
#import <EXAppLoaderProvider/EXAppRecordInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXTaskExecutionRequest : NSObject

@property (nonatomic, strong) void(^callback)(NSArray * _Nonnull results);

- (instancetype)initWithCallback:(void(^)(NSArray * _Nonnull results))callback;

- (void)addTask:(nonnull id<EXTaskInterface>)task;
- (void)task:(nonnull id<EXTaskInterface>)task didFinishWithResult:(id)result;
- (BOOL)isIncludingTask:(nullable id<EXTaskInterface>)task;
- (void)maybeEvaluate;

@end

NS_ASSUME_NONNULL_END
