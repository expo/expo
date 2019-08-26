// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXTaskManager/ABI32_0_0EXTaskExecutionRequest.h>

@interface ABI32_0_0EXTaskExecutionRequest ()

@property (nonatomic, strong, nullable) NSMutableSet<id<ABI32_0_0EXTaskInterface>> *tasks;
@property (nonatomic, strong, nullable) NSMutableArray<id> *results;
@property (nonatomic, assign) int tasksCount;

@end


@implementation ABI32_0_0EXTaskExecutionRequest

- (instancetype)initWithCallback:(void(^)(NSArray *results))callback
{
  if (self = [super init]) {
    _callback = callback;
    _tasks = [NSMutableSet new];
    _results = [NSMutableArray new];
  }
  return self;
}

- (void)addTask:(nonnull id<ABI32_0_0EXTaskInterface>)task
{
  [_tasks addObject:task];
}

- (void)task:(nonnull id<ABI32_0_0EXTaskInterface>)task didFinishWithResult:(id)result
{
  [_tasks removeObject:task];
  [_results addObject:result];
  [self maybeEvaluate];
}

- (BOOL)isIncludingTask:(nullable id<ABI32_0_0EXTaskInterface>)task
{
  return task && [_tasks containsObject:task];
}

- (void)maybeEvaluate
{
  if ([_tasks count] == 0) {
    [self _maybeExecuteCallback];
  }
}

# pragma mark - helpers

- (void)_maybeExecuteCallback
{
  if (_callback) {
    _callback(_results);
    _callback = nil;
    _tasks = nil;
    _results = nil;
  }
}

@end
