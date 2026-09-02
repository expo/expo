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
  [_tasks addObject:task];
}

- (void)task:(nonnull id<EXTaskInterface>)task didFinishWithResult:(id)result
{
  [_tasks removeObject:task];
  [_results addObject:result];
  [self maybeEvaluate];
}

- (BOOL)isIncludingTask:(nullable id<EXTaskInterface>)task
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
    __strong EXTaskExecutionRequest *strongSelf = self;

    // Capture the callback and results, then clear the request state before invoking. The callback is a
    // one-shot completion that unregisters this request and breaks the retain cycle keeping its captured
    // state alive, so a re-entrant or duplicated evaluation (e.g. a task finishing during a foreground
    // transition) must not pass the `_callback` guard again and fire against freed memory.
    void (^callback)(NSArray *) = _callback;
    NSArray *results = _results;
    _callback = nil;
    _tasks = nil;
    _results = nil;

    callback(results);
    strongSelf = nil;
  }
}

@end
