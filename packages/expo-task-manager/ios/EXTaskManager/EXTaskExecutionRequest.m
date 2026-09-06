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
  // `_tasks` is mutated from whichever thread registers tasks and read from the
  // threads that complete them (main, JS, app loader), so every access must be
  // synchronized. `@synchronized` is reentrant per-thread, which keeps the
  // consumer call-out paths that re-enter this class safe.
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
  // Evaluate outside the lock — `maybeEvaluate` may invoke the completion
  // callback, which calls back into EXTaskService and must not run under
  // this request's lock.
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
  BOOL shouldExecute;
  @synchronized (self) {
    shouldExecute = [_tasks count] == 0;
  }
  if (shouldExecute) {
    [self _maybeExecuteCallback];
  }
}

# pragma mark - helpers

- (void)_maybeExecuteCallback
{
  // Make a strong pointer to self before executing a callback as the request may be deallocated there,
  // due to this fact `_callback = nil;` was crashing on older versions of iOS (below 12.0).
  __strong EXTaskExecutionRequest *strongSelf = self;

  // Capture the callback and results, then clear the request state before invoking. The callback is a
  // one-shot completion that unregisters this request and breaks the retain cycle keeping its captured
  // state alive, so a re-entrant or duplicated evaluation (e.g. a task finishing during a foreground
  // transition) must not pass the `_callback` guard again and fire against freed memory.
  //
  // The capture-and-clear must be atomic: two threads passing the count check in `maybeEvaluate`
  // concurrently would otherwise both capture `_callback` before either clears it, and the completion
  // would fire twice against state the first invocation already tore down.
  void (^callback)(NSArray *) = nil;
  NSArray *results = nil;

  @synchronized (self) {
    if (_callback != nil) {
      callback = _callback;
      results = _results;
      _callback = nil;
      _tasks = nil;
      _results = nil;
    }
  }

  // Invoke outside the lock — the callback calls back into EXTaskService.
  if (callback != nil) {
    callback(results);
  }
  strongSelf = nil;
}

@end
