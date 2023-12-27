//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppLauncherWithDatabase.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesErrorRecovery.h>
#import <ABI44_0_0React/ABI44_0_0RCTAssert.h>
#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTRootView.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI44_0_0EXUpdatesErrorRecoveryTask) {
  ABI44_0_0EXUpdatesErrorRecoveryTaskWaitForRemoteUpdate,
  ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchNew,
  ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchCached,
  ABI44_0_0EXUpdatesErrorRecoveryTaskCrash
};

static NSString * const ABI44_0_0EXUpdatesErrorLogFile = @"expo-error.log";
static NSInteger const ABI44_0_0EXUpdatesErrorRecoveryRemoteLoadTimeoutMs = 5000;

@interface ABI44_0_0EXUpdatesErrorRecovery ()

@property (nonatomic, strong) NSMutableArray<NSNumber *> *pipeline;
@property (nonatomic, assign) BOOL isRunning;
@property (nonatomic, assign) BOOL isWaitingForRemoteUpdate;
@property (nonatomic, assign) BOOL rctContentHasAppeared;
@property (nonatomic, assign) NSInteger remoteLoadTimeout;

@property (nonatomic, strong) dispatch_queue_t errorRecoveryQueue;
@property (nonatomic, strong, nullable) dispatch_queue_t diskWriteQueue;

@property (nonatomic, strong) NSMutableArray *encounteredErrors;

@property (nonatomic, copy) ABI44_0_0RCTFatalHandler previousFatalErrorHandler;
@property (nonatomic, copy) ABI44_0_0RCTFatalExceptionHandler previousFatalExceptionHandler;

@end

@implementation ABI44_0_0EXUpdatesErrorRecovery

- (instancetype)init
{
  return [self initWithErrorRecoveryQueue:dispatch_queue_create("expo.controller.errorRecoveryQueue", DISPATCH_QUEUE_SERIAL)
                           diskWriteQueue:nil
                        remoteLoadTimeout:ABI44_0_0EXUpdatesErrorRecoveryRemoteLoadTimeoutMs];
}

- (instancetype)initWithErrorRecoveryQueue:(dispatch_queue_t)errorRecoveryQueue
                            diskWriteQueue:(nullable dispatch_queue_t)diskWriteQueue
                         remoteLoadTimeout:(NSInteger)remoteLoadTimeout
{
  if (self = [super init]) {
    // tasks should never be added to the pipeline after this point, only removed
    _pipeline = @[
      @(ABI44_0_0EXUpdatesErrorRecoveryTaskWaitForRemoteUpdate),
      @(ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchNew),
      @(ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchCached),
      @(ABI44_0_0EXUpdatesErrorRecoveryTaskCrash)
    ].mutableCopy;
    _isRunning = NO;
    _isWaitingForRemoteUpdate = NO;
    _rctContentHasAppeared = NO;
    _errorRecoveryQueue = errorRecoveryQueue;
    _diskWriteQueue = diskWriteQueue;
    _remoteLoadTimeout = remoteLoadTimeout;
    _encounteredErrors = [NSMutableArray new];
  }
  return self;
}

- (void)startMonitoring
{
  [self _setRCTErrorHandlers];
}

- (void)handleError:(NSError *)error
{
  [self _startPipelineWithEncounteredError:error];
  [self writeErrorOrExceptionToLog:error];
}

- (void)handleException:(NSException *)exception
{
  [self _startPipelineWithEncounteredError:exception];
  [self writeErrorOrExceptionToLog:exception];
}

- (void)notifyNewRemoteLoadStatus:(ABI44_0_0EXUpdatesRemoteLoadStatus)newStatus
{
  dispatch_async(_errorRecoveryQueue, ^{
    if (!self->_isWaitingForRemoteUpdate) {
      return;
    }
    self->_isWaitingForRemoteUpdate = NO;
    if (newStatus != ABI44_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded) {
      [self->_pipeline removeObject:@(ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchNew)];
    }
    [self _runNextTask];
  });
}

# pragma mark - pipeline tasks

- (void)_startPipelineWithEncounteredError:(id)encounteredError
{
  dispatch_async(_errorRecoveryQueue, ^{
    [self->_encounteredErrors addObject:encounteredError];

    if (self->_delegate.launchedUpdate.successfulLaunchCount > 0) {
      [self->_pipeline removeObject:@(ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchCached)];
    } else if (!self->_rctContentHasAppeared) {
      [self->_delegate markFailedLaunchForLaunchedUpdate];
    }

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
  switch ((ABI44_0_0EXUpdatesErrorRecoveryTask)nextTask.integerValue) {
    case ABI44_0_0EXUpdatesErrorRecoveryTaskWaitForRemoteUpdate:
      [self _waitForRemoteLoaderToFinish];
      break;
    // ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchNew is called only after a new update is downloaded
    // and added to the cache, so it is equivalent to ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchCached
    case ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchNew:
    case ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchCached:
      [self _tryRelaunchFromCache];
      break;
    case ABI44_0_0EXUpdatesErrorRecoveryTaskCrash:
      [self _crash];
      break;
    default:
      @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"ABI44_0_0EXUpdatesErrorRecovery cannot run the next task" userInfo:@{@"nextTaskValue": nextTask}];
  }
}

- (void)_waitForRemoteLoaderToFinish
{
  dispatch_assert_queue(_errorRecoveryQueue);
  if (_delegate.remoteLoadStatus == ABI44_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded) {
    [self _runNextTask];
  } else if (_delegate.config.checkOnLaunch != ABI44_0_0EXUpdatesCheckAutomaticallyConfigNever ||
             _delegate.remoteLoadStatus == ABI44_0_0EXUpdatesRemoteLoadStatusLoading) {
    _isWaitingForRemoteUpdate = YES;
    if (_delegate.remoteLoadStatus != ABI44_0_0EXUpdatesRemoteLoadStatusLoading) {
      [_delegate loadRemoteUpdate];
    }
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, _remoteLoadTimeout * NSEC_PER_MSEC), _errorRecoveryQueue, ^{
      if (!self->_isWaitingForRemoteUpdate) {
        return;
      }
      self->_isWaitingForRemoteUpdate = NO;
      [self->_pipeline removeObject:@(ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchNew)];
      [self _runNextTask];
    });
    return;
  } else {
    // there's no remote update, so move to the next step in the pipeline
    [self->_pipeline removeObject:@(ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchNew)];
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
        [self->_pipeline removeObject:@(ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchNew)];
        [self->_pipeline removeObject:@(ABI44_0_0EXUpdatesErrorRecoveryTaskLaunchCached)];
        [self _runNextTask];
      } else {
        self->_isRunning = NO;
      }
    });
  }];
}

- (void)_crash
{
  // create new exception object from stack of errors
  // use the initial error and put the rest into userInfo
  id initialError = _encounteredErrors[0];
  [_encounteredErrors removeObjectAtIndex:0];

  if ([initialError isKindOfClass:[NSError class]] && _previousFatalErrorHandler) {
    _previousFatalErrorHandler(initialError);
  } else if ([initialError isKindOfClass:[NSException class]] && _previousFatalExceptionHandler) {
    _previousFatalExceptionHandler(initialError);
  }

  NSString *name;
  NSString *reason;
  NSMutableDictionary *userInfo;
  if ([initialError isKindOfClass:[NSError class]]) {
    // format these keys similar to RN -- ABI44_0_0RCTFatal in ABI44_0_0RCTAssert.m
    name = [NSString stringWithFormat:@"%@: %@", ABI44_0_0RCTFatalExceptionName, ((NSError *)initialError).localizedDescription];
    reason = ABI44_0_0RCTFormatError(((NSError *)initialError).localizedDescription, ((NSError *)initialError).userInfo[ABI44_0_0RCTJSStackTraceKey], 175);
    userInfo = [((NSError *)initialError).userInfo mutableCopy];
    userInfo[@"ABI44_0_0RCTUntruncatedMessageKey"] = ABI44_0_0RCTFormatError(((NSError *)initialError).localizedDescription, ((NSError *)initialError).userInfo[ABI44_0_0RCTJSStackTraceKey], -1);
  } else if ([initialError isKindOfClass:[NSException class]]) {
    name = ((NSException *)initialError).name;
    reason = ((NSException *)initialError).reason;
    userInfo = ((NSException *)initialError).userInfo.mutableCopy;
  } else {
    NSAssert(NO, @"Shouldn't add object types other than NSError or NSException to _encounteredErrors");
  }

  userInfo[@"ABI44_0_0EXUpdatesLaterEncounteredErrors"] = [_encounteredErrors copy];
  [_delegate throwException:[NSException exceptionWithName:name reason:reason userInfo:userInfo]];
}

# pragma mark - monitoring / lifecycle

- (void)_registerObservers
{
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_handleJavaScriptDidFailToLoad) name:ABI44_0_0RCTJavaScriptDidFailToLoadNotification object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_handleContentDidAppear) name:ABI44_0_0RCTContentDidAppearNotification object:nil];
}

- (void)_unregisterObservers
{
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI44_0_0RCTJavaScriptDidFailToLoadNotification object:nil];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:ABI44_0_0RCTContentDidAppearNotification object:nil];
}

- (void)_handleJavaScriptDidFailToLoad
{
  [self _unregisterObservers];
}

- (void)_handleContentDidAppear
{
  [self _unregisterObservers];
  [_delegate markSuccessfulLaunchForLaunchedUpdate];
  dispatch_async(_errorRecoveryQueue, ^{
    self->_rctContentHasAppeared = YES;
    // the launch now counts as "successful" so we don't want to roll back;
    // remove any extraneous tasks from the pipeline as such
    self->_pipeline = [self->_pipeline objectsAtIndexes:[self->_pipeline indexesOfObjectsPassingTest:^BOOL(NSNumber *obj, NSUInteger idx, BOOL *stop) {
      return obj.integerValue == ABI44_0_0EXUpdatesErrorRecoveryTaskWaitForRemoteUpdate || obj.integerValue == ABI44_0_0EXUpdatesErrorRecoveryTaskCrash;
    }]].mutableCopy;
  });
  // wait 10s before unsetting error handlers; even though we won't try to relaunch if our handlers
  // are triggered after now, we still want to give the app a reasonable window of time to start the
  // ABI44_0_0EXUpdatesErrorRecoveryTaskWaitForRemoteUpdate task and check for a new update is there is one
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 10 * NSEC_PER_SEC), _errorRecoveryQueue, ^{
    [self _unsetRCTErrorHandlers];
  });
}

- (void)_setRCTErrorHandlers
{
  dispatch_async(_errorRecoveryQueue, ^{
    self->_rctContentHasAppeared = NO;
  });
  [self _registerObservers];

  if (_previousFatalErrorHandler || _previousFatalExceptionHandler) {
    return;
  }

  _previousFatalErrorHandler = ABI44_0_0RCTGetFatalHandler();
  _previousFatalExceptionHandler = ABI44_0_0RCTGetFatalExceptionHandler();

  ABI44_0_0RCTFatalHandler fatalErrorHandler = ^(NSError *error) {
    [self handleError:error];
  };
  ABI44_0_0RCTFatalExceptionHandler fatalExceptionHandler = ^(NSException *exception) {
    [self handleException:exception];
  };
  ABI44_0_0RCTSetFatalHandler(fatalErrorHandler);
  ABI44_0_0RCTSetFatalExceptionHandler(fatalExceptionHandler);
}

- (void)_unsetRCTErrorHandlers
{
  ABI44_0_0RCTSetFatalHandler(_previousFatalErrorHandler);
  ABI44_0_0RCTSetFatalExceptionHandler(_previousFatalExceptionHandler);
  _previousFatalErrorHandler = nil;
  _previousFatalExceptionHandler = nil;
}

# pragma mark - error persisting

+ (nullable NSString *)consumeErrorLog
{
  NSString *errorLogFilePath = [[self class] _errorLogFilePath];
  NSData *data = [NSData dataWithContentsOfFile:errorLogFilePath options:kNilOptions error:nil];
  if (data) {
    NSError *err;
    if (![NSFileManager.defaultManager removeItemAtPath:errorLogFilePath error:&err]) {
      NSLog(@"Could not delete error log: %@", err.localizedDescription);
    }
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  } else {
    return nil;
  }
}

- (void)writeErrorOrExceptionToLog:(id)errorOrException
{
  dispatch_async(_diskWriteQueue ?: dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSString *serializedError;
    if ([errorOrException isKindOfClass:[NSError class]]) {
      serializedError = [NSString stringWithFormat:@"Fatal error: %@", [self _serializeError:(NSError *)errorOrException]];
    } else if ([errorOrException isKindOfClass:[NSException class]]) {
      serializedError = [NSString stringWithFormat:@"Fatal exception: %@", [self _serializeException:(NSException *)errorOrException]];
    } else {
      return;
    }

    NSData *data = [serializedError dataUsingEncoding:NSUTF8StringEncoding];
    NSString *errorLogFilePath = [[self class] _errorLogFilePath];
    if ([NSFileManager.defaultManager fileExistsAtPath:errorLogFilePath]) {
      NSFileHandle *fileHandle = [NSFileHandle fileHandleForWritingAtPath:errorLogFilePath];
      [fileHandle seekToEndOfFile];
      [fileHandle writeData:data];
      [fileHandle closeFile];
    } else {
      NSError *err;
      if (![data writeToFile:[[self class] _errorLogFilePath] options:NSDataWritingAtomic error:&err]) {
        NSLog(@"Could not write fatal error to log: %@", err.localizedDescription);
      }
    }
  });
}

- (NSString *)_serializeException:(NSException *)exception
{
  return [NSString stringWithFormat:@"Time: %f\nName: %@\nReason: %@\n\n",
    [NSDate date].timeIntervalSince1970 * 1000,
    exception.name,
    exception.reason];
}

- (NSString *)_serializeError:(NSError *)error
{
  NSString *localizedFailureReason = error.localizedFailureReason;
  NSError *underlyingError = error.userInfo[NSUnderlyingErrorKey];

  NSMutableString *serialization = [[NSString stringWithFormat:@"Time: %f\nDomain: %@\nCode: %li\nDescription: %@",
                                     [[NSDate date] timeIntervalSince1970] * 1000,
                                     error.domain,
                                     (long)error.code,
                                     error.localizedDescription] mutableCopy];
  if (localizedFailureReason) {
    [serialization appendFormat:@"\nFailure Reason: %@", localizedFailureReason];
  }
  if (underlyingError) {
    [serialization appendFormat:@"\n\nUnderlying Error:\n%@", [self _serializeError:underlyingError]];
  }
  [serialization appendString:@"\n\n"];
  return serialization;
}

+ (NSString *)_errorLogFilePath
{
  NSURL *applicationDocumentsDirectory = [[NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask] lastObject];
  return [[applicationDocumentsDirectory URLByAppendingPathComponent:ABI44_0_0EXUpdatesErrorLogFile] path];
}

@end

NS_ASSUME_NONNULL_END
