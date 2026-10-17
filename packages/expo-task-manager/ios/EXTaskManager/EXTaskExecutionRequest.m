// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoTaskManager/EXTaskExecutionRequest.h>

@interface EXTaskExecutionRequest ()

@property (nonatomic, strong, nullable) NSMutableSet<id<EXTaskInterface>> *tasks;
@property (nonatomic, strong, nullable) NSMutableArray<id> *results;
@property (nonatomic, assign) int tasksCount;

@end


@implementation EXTaskExecutionRequest

- (instancetype)initWithCallback:(void(^)(NSArray *results))callback
{
  if (self = [super init]) {
    _callback = callback;
    _tasks = [NSMutableSet new];
    _results = [NSMutableArray new];
  }
  return self;
}

- (void)addTask:(nonnull id<EXTaskInterface>)task
{
  @synchronized (self) {
    [_tasks addObject:task];
  }
}

- (void)task:(nonnull id<EXTaskInterface>)task didFinishWithResult:(id)result
{
  @synchronized (self) {
    [_tasks removeObject:task];
    [_results addObject:result];
  }
  [self maybeEvaluate];
}

- (BOOL)isIncludingTask:(nullable id<EXTaskInterface>)task
{
  @synchronized (self) {
    return task && [_tasks containsObject:task];
  }
}

- (void)maybeEvaluate
{
  [self _maybeExecuteCallback];
}

# pragma mark - helpers

- (void)_maybeExecuteCallback
{
  // Make a strong pointer to self before executing a callback as the request may be deallocated there,
  // due to this fact `_callback = nil;` was crashing on older versions of iOS (below 12.0).
  __strong EXTaskExecutionRequest *strongSelf = self;
  void (^callback)(NSArray *) = nil;
  NSArray *results = nil;

  // The launch thread evaluates the request after adding its tasks, while the last task can finish on
  // another thread at the same time, so both can get here at once. Check that every task finished and
  // take the callback in one step, so that only one of them runs it. The callback is a one-shot
  // completion that unregisters this request, so it must never run twice.
  @synchronized (self) {
    if (_callback == nil || [_tasks count] > 0) {
      return;
    }
    callback = _callback;
    results = _results;
    _callback = nil;
    _tasks = nil;
    _results = nil;
  }

  // Run the callback outside of the lock, as it calls back into the task service.
  callback(results);
  strongSelf = nil;
}

@end
