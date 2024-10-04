// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXTaskManager/ABI42_0_0EXTaskExecutionRequest.h>

@interface ABI42_0_0EXTaskExecutionRequest ()

@property (nonatomic, strong, nullable) NSMutableSet<id<ABI42_0_0UMTaskInterface>> *tasks;
@property (nonatomic, strong, nullable) NSMutableArray<id> *results;
@property (nonatomic, assign) int tasksCount;

@end


@implementation ABI42_0_0EXTaskExecutionRequest

- (instancetype)initWithCallback:(void(^)(NSArray *results))callback
{
  if (self = [super init]) {
    _callback = callback;
    _tasks = [NSMutableSet new];
    _results = [NSMutableArray new];
  }
  return self;
}

- (void)addTask:(nonnull id<ABI42_0_0UMTaskInterface>)task
{
  [_tasks addObject:task];
}

- (void)task:(nonnull id<ABI42_0_0UMTaskInterface>)task didFinishWithResult:(id)result
{
  [_tasks removeObject:task];
  [_results addObject:result];
  [self maybeEvaluate];
}

- (BOOL)isIncludingTask:(nullable id<ABI42_0_0UMTaskInterface>)task
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
    // Make a strong pointer to self before executing a callback as the request may be deallocated there,
    // due to this fact `_callback = nil;` was crashing on older versions of iOS (below 12.0).
    __strong ABI42_0_0EXTaskExecutionRequest *strongSelf = self;

    _callback(_results);
    _callback = nil;
    _tasks = nil;
    _results = nil;
    strongSelf = nil;
  }
}

@end
