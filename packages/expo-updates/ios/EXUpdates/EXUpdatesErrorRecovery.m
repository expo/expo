//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLauncherWithDatabase.h>
#import <EXUpdates/EXUpdatesErrorRecovery.h>
#import <React/RCTAssert.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXUpdatesErrorRecoveryTask) {
  EXUpdatesErrorRecoveryTaskWaitForRemoteUpdate,
  EXUpdatesErrorRecoveryTaskLaunchNew,
  EXUpdatesErrorRecoveryTaskLaunchCached,
  EXUpdatesErrorRecoveryTaskLaunchEmbedded,
  EXUpdatesErrorRecoveryTaskCrash
};

@interface EXUpdatesErrorRecovery ()

@property (nonatomic, strong) NSMutableArray<NSNumber *> *pipeline;
@property (nonatomic, assign) BOOL isRunning;
@property (nonatomic, assign) BOOL isWaitingForRemoteUpdate;
@property (nonatomic, strong) dispatch_queue_t errorRecoveryQueue;

@property (nonatomic, strong) NSMutableArray *encounteredErrors;

@end

@implementation EXUpdatesErrorRecovery

- (instancetype)init
{
  if (self = [super init]) {
    _pipeline = @[
      @(EXUpdatesErrorRecoveryTaskWaitForRemoteUpdate),
      @(EXUpdatesErrorRecoveryTaskLaunchCached),
      @(EXUpdatesErrorRecoveryTaskLaunchEmbedded),
      @(EXUpdatesErrorRecoveryTaskCrash)
    ].mutableCopy;
    _isRunning = NO;
    _isWaitingForRemoteUpdate = NO;
    _errorRecoveryQueue = dispatch_queue_create("expo.controller.errorRecoveryQueue", DISPATCH_QUEUE_SERIAL);
    _encounteredErrors = [NSMutableArray new];
  }
  return self;
}

- (void)handleError:(NSError *)error fromLaunchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate
{
  if (launchedUpdate) {
    [self _markUpdateFailed:launchedUpdate];
  }
  [self _startPipelineWithEncounteredError:error];
}

- (void)handleException:(NSException *)exception fromLaunchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate
{
  if (launchedUpdate) {
    [self _markUpdateFailed:launchedUpdate];
  }
  [self _startPipelineWithEncounteredError:exception];
}

- (void)notifyNewRemoteLoadStatus:(EXUpdatesRemoteLoadStatus)newStatus
{
  dispatch_async(_errorRecoveryQueue, ^{
    if (!self->_isWaitingForRemoteUpdate) {
      return;
    }
    self->_isWaitingForRemoteUpdate = NO;
    if (newStatus == EXUpdatesRemoteLoadStatusNewUpdateLoaded) {
      [self->_pipeline insertObject:@(EXUpdatesErrorRecoveryTaskLaunchNew) atIndex:0];
    }
    [self _runNextTask];
  });
}

# pragma mark - pipeline tasks

- (void)_startPipelineWithEncounteredError:(id)encounteredError
{
  dispatch_async(_errorRecoveryQueue, ^{
    [self->_encounteredErrors addObject:encounteredError];
    if (!self->_isRunning) {
      self->_isRunning = YES;
      [self _runNextTask];
    }
  });
}

- (void)_runNextTask
{
  dispatch_assert_queue(_errorRecoveryQueue);
  NSNumber *nextTask = _pipeline[0];
  [_pipeline removeObjectAtIndex:0];
  switch ((EXUpdatesErrorRecoveryTask)nextTask.integerValue) {
    case EXUpdatesErrorRecoveryTaskWaitForRemoteUpdate:
      [self _waitForRemoteLoaderToFinish];
      break;
    case EXUpdatesErrorRecoveryTaskLaunchNew:
    case EXUpdatesErrorRecoveryTaskLaunchCached:
      [self _tryRelaunchFromCache];
      break;
    case EXUpdatesErrorRecoveryTaskLaunchEmbedded:
      [self _tryLaunchEmbeddedUpdate];
      break;
    case EXUpdatesErrorRecoveryTaskCrash:
      [self _crash];
      break;
    default:
      @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"EXUpdatesErrorRecovery cannot run the next task" userInfo:@{@"nextTaskValue": nextTask}];
  }
}

- (void)_markUpdateFailed:(EXUpdatesUpdate *)update
{
  dispatch_async(_delegate.database.databaseQueue, ^{
    NSError *error;
    [self.delegate.database markUpdateFailed:update error:&error];
    if (error) {
      NSLog(@"Unable to mark update as failed in the local DB: %@", error.localizedDescription);
      dispatch_async(self->_errorRecoveryQueue, ^{
        [self->_pipeline removeObject:@(EXUpdatesErrorRecoveryTaskLaunchCached)];
      });
    }
  });
}

- (void)_waitForRemoteLoaderToFinish
{
  dispatch_assert_queue(_errorRecoveryQueue);
  if (_delegate.remoteLoadStatus == EXUpdatesRemoteLoadStatusLoading) {
    _isWaitingForRemoteUpdate = YES;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 5 * NSEC_PER_SEC), _errorRecoveryQueue, ^{
      if (!self->_isWaitingForRemoteUpdate) {
        return;
      }
      self->_isWaitingForRemoteUpdate = NO;
      [self _runNextTask];
    });
    return;
  } else if (_delegate.remoteLoadStatus == EXUpdatesRemoteLoadStatusNewUpdateLoaded) {
    [_pipeline insertObject:@(EXUpdatesErrorRecoveryTaskLaunchNew) atIndex:0];
    [self _runNextTask];
  } else {
    [self _runNextTask];
  }
}

- (void)_tryRelaunchFromCache
{
  dispatch_assert_queue(_errorRecoveryQueue);
  [_delegate relaunchWithCompletion:^(NSError * _Nullable error, BOOL success) {
    dispatch_async(self->_errorRecoveryQueue, ^{
      if (!success) {
        if (error) {
          [self->_encounteredErrors addObject:error];
        }
        [self->_pipeline removeObject:@(EXUpdatesErrorRecoveryTaskLaunchCached)];
        [self _runNextTask];
      } else {
        self->_isRunning = NO;
      }
    });
  }];
}

- (void)_tryLaunchEmbeddedUpdate
{
  dispatch_assert_queue(_errorRecoveryQueue);
  BOOL success = [_delegate relaunchUsingEmbeddedUpdate];
  if (!success) {
    [self _runNextTask];
  } else {
    self->_isRunning = NO;
  }
}

- (void)_crash
{
  // create new exception object from stack of errors
  // use the initial error and put the rest into userInfo
  id initialError = _encounteredErrors[0];
  [_encounteredErrors removeObjectAtIndex:0];

  NSString *name;
  NSString *reason;
  NSMutableDictionary *userInfo;
  if ([initialError isKindOfClass:[NSError class]]) {
    // format these keys similar to RN -- RCTFatal in RCTAssert.m
    name = [NSString stringWithFormat:@"%@: %@", RCTFatalExceptionName, ((NSError *)initialError).localizedDescription];
    reason = RCTFormatError(((NSError *)initialError).localizedDescription, ((NSError *)initialError).userInfo[RCTJSStackTraceKey], 175);
    userInfo = [((NSError *)initialError).userInfo mutableCopy];
    userInfo[@"RCTUntruncatedMessageKey"] = RCTFormatError(((NSError *)initialError).localizedDescription, ((NSError *)initialError).userInfo[RCTJSStackTraceKey], -1);
  } else if ([initialError isKindOfClass:[NSException class]]) {
    name = ((NSException *)initialError).name;
    reason = ((NSException *)initialError).reason;
    userInfo = ((NSException *)initialError).userInfo.mutableCopy;
  } else {
    NSAssert(NO, @"Shouldn't add object types other than NSError or NSException to _encounteredErrors");
  }

  userInfo[@"EXUpdatesLaterEncounteredErrors"] = [_encounteredErrors copy];
  @throw [NSException exceptionWithName:name reason:reason userInfo:userInfo];
}

@end

NS_ASSUME_NONNULL_END
