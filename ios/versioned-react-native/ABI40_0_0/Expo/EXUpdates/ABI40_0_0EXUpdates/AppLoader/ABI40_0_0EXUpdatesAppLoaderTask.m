//  Copyright © 2020 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesAppLauncherWithDatabase.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesAppLoaderTask.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesReaper.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI40_0_0EXUpdatesAppLoaderTaskErrorDomain = @"ABI40_0_0EXUpdatesAppLoaderTask";

@interface ABI40_0_0EXUpdatesAppLoaderTask ()

@property (nonatomic, strong) ABI40_0_0EXUpdatesConfig *config;
@property (nonatomic, strong) ABI40_0_0EXUpdatesDatabase *database;
@property (nonatomic, strong) NSURL *directory;
@property (nonatomic, strong) id<ABI40_0_0EXUpdatesSelectionPolicy> selectionPolicy;
@property (nonatomic, strong) dispatch_queue_t delegateQueue;

@property (nonatomic, strong) id<ABI40_0_0EXUpdatesAppLauncher> launcher;
@property (nonatomic, strong) ABI40_0_0EXUpdatesEmbeddedAppLoader *embeddedAppLoader;
@property (nonatomic, strong) ABI40_0_0EXUpdatesRemoteAppLoader *remoteAppLoader;

@property (nonatomic, strong) id<ABI40_0_0EXUpdatesAppLauncher> candidateLauncher;
@property (nonatomic, strong) NSTimer *timer;
@property (nonatomic, assign) BOOL isReadyToLaunch;
@property (nonatomic, assign) BOOL isTimerFinished;
@property (nonatomic, assign) BOOL hasLaunched;
@property (nonatomic, assign) BOOL isUpToDate;
@property (nonatomic, strong) dispatch_queue_t loaderTaskQueue;


@end

@implementation ABI40_0_0EXUpdatesAppLoaderTask

- (instancetype)initWithConfig:(ABI40_0_0EXUpdatesConfig *)config
                      database:(ABI40_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               selectionPolicy:(id<ABI40_0_0EXUpdatesSelectionPolicy>)selectionPolicy
                 delegateQueue:(dispatch_queue_t)delegateQueue
{
  if (self = [super init]) {
    _config = config;
    _database = database;
    _directory = directory;
    _selectionPolicy = selectionPolicy;
    _isUpToDate = NO;
    _delegateQueue = delegateQueue;
    _loaderTaskQueue = dispatch_queue_create("expo.loader.LoaderTaskQueue", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

- (void)start
{
  if (!_config.isEnabled) {
    dispatch_async(_delegateQueue, ^{
      [self->_delegate appLoaderTask:self
                  didFinishWithError:[NSError errorWithDomain:ABI40_0_0EXUpdatesAppLoaderTaskErrorDomain code:1030 userInfo:@{
                    NSLocalizedDescriptionKey: @"ABI40_0_0EXUpdatesAppLoaderTask was passed a configuration object with updates disabled. You should load updates from an embedded source rather than calling ABI40_0_0EXUpdatesAppLoaderTask, or enable updates in the configuration."
                  }]];
    });
    return;
  }

  if (!_config.updateUrl) {
    dispatch_async(_delegateQueue, ^{
      [self->_delegate appLoaderTask:self
                  didFinishWithError:[NSError errorWithDomain:ABI40_0_0EXUpdatesAppLoaderTaskErrorDomain code:1030 userInfo:@{
                    NSLocalizedDescriptionKey: @"ABI40_0_0EXUpdatesAppLoaderTask was passed a configuration object with a null URL. You must pass a nonnull URL in order to use ABI40_0_0EXUpdatesAppLoaderTask to load updates."
                  }]];
    });
    return;
  }

  if (!_directory) {
    dispatch_async(_delegateQueue, ^{
      [self->_delegate appLoaderTask:self
                  didFinishWithError:[NSError errorWithDomain:ABI40_0_0EXUpdatesAppLoaderTaskErrorDomain code:1030 userInfo:@{
                    NSLocalizedDescriptionKey: @"ABI40_0_0EXUpdatesAppLoaderTask directory must be nonnull."
                  }]];
    });
    return;
  }

  __block BOOL shouldCheckForUpdate = [ABI40_0_0EXUpdatesUtils shouldCheckForUpdateWithConfig:_config];
  NSNumber *launchWaitMs = _config.launchWaitMs;
  if ([launchWaitMs isEqualToNumber:@(0)] || !shouldCheckForUpdate) {
    self->_isTimerFinished = YES;
  } else {
    NSDate *fireDate = [NSDate dateWithTimeIntervalSinceNow:[launchWaitMs doubleValue] / 1000];
    self->_timer = [[NSTimer alloc] initWithFireDate:fireDate interval:0 target:self selector:@selector(_timerDidFire) userInfo:nil repeats:NO];
    [[NSRunLoop mainRunLoop] addTimer:self->_timer forMode:NSDefaultRunLoopMode];
  }

  [self _loadEmbeddedUpdateWithCompletion:^{
    [self _launchWithCompletion:^(NSError * _Nullable error, BOOL success) {
      if (!success) {
        if (!shouldCheckForUpdate){
          [self _finishWithError:error];
        }
        NSLog(@"Failed to launch embedded or launchable update: %@", error.localizedDescription);
      } else {
        if (self->_delegate &&
            ![self->_delegate appLoaderTask:self didLoadCachedUpdate:self->_launcher.launchedUpdate]) {
          // ignore timer and other settings and force launch a remote update.
          self->_launcher = nil;
          [self _stopTimer];
          shouldCheckForUpdate = YES;
        } else {
          self->_isReadyToLaunch = YES;
          [self _maybeFinish];
        }
      }

      if (shouldCheckForUpdate) {
        [self _loadRemoteUpdateWithCompletion:^(NSError * _Nullable error, ABI40_0_0EXUpdatesUpdate * _Nullable update) {
          [self _handleRemoteUpdateLoaded:update error:error];
        }];
      } else {
        [self _runReaper];
      }
    }];
  }];
}

- (void)_finishWithError:(nullable NSError *)error
{
  dispatch_assert_queue(_loaderTaskQueue);

  if (_hasLaunched) {
    // we've already fired once, don't do it again
    return;
  }
  _hasLaunched = YES;

  if (_delegate) {
    dispatch_async(_delegateQueue, ^{
      if (self->_isReadyToLaunch && (self->_launcher.launchAssetUrl || self->_launcher.launchedUpdate.status == ABI40_0_0EXUpdatesUpdateStatusDevelopment)) {
        [self->_delegate appLoaderTask:self didFinishWithLauncher:self->_launcher isUpToDate:self->_isUpToDate];
      } else {
        [self->_delegate appLoaderTask:self didFinishWithError:error ?: [NSError errorWithDomain:ABI40_0_0EXUpdatesAppLoaderTaskErrorDomain code:1031 userInfo:@{
          NSLocalizedDescriptionKey: @"ABI40_0_0EXUpdatesAppLoaderTask encountered an unexpected error and could not launch an update."
        }]];
      }
    });
  }

  [self _stopTimer];
}

- (void)_maybeFinish
{
  if (!_isTimerFinished || !_isReadyToLaunch) {
    // too early, bail out
    return;
  }
  [self _finishWithError:nil];
}

- (void)_timerDidFire
{
  dispatch_async(_loaderTaskQueue, ^{
    self->_isTimerFinished = YES;
    [self _maybeFinish];
  });
}

- (void)_stopTimer
{
  if (_timer) {
    [_timer invalidate];
    _timer = nil;
  }
  _isTimerFinished = YES;
}

- (void)_runReaper
{
  if (_launcher.launchedUpdate) {
    [ABI40_0_0EXUpdatesReaper reapUnusedUpdatesWithConfig:_config
                                        database:_database
                                       directory:_directory
                                 selectionPolicy:_selectionPolicy
                                  launchedUpdate:_launcher.launchedUpdate];
  }
}

- (void)_loadEmbeddedUpdateWithCompletion:(void (^)(void))completion
{
  [ABI40_0_0EXUpdatesAppLauncherWithDatabase launchableUpdateWithConfig:_config database:_database selectionPolicy:_selectionPolicy completion:^(NSError * _Nullable error, ABI40_0_0EXUpdatesUpdate * _Nullable launchableUpdate) {
    if (self->_config.hasEmbeddedUpdate &&
        [self->_selectionPolicy shouldLoadNewUpdate:[ABI40_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:self->_config database:self->_database]
                                 withLaunchedUpdate:launchableUpdate]) {
      self->_embeddedAppLoader = [[ABI40_0_0EXUpdatesEmbeddedAppLoader alloc] initWithConfig:self->_config database:self->_database directory:self->_directory completionQueue:self->_loaderTaskQueue];
      [self->_embeddedAppLoader loadUpdateFromEmbeddedManifestWithCallback:^BOOL(ABI40_0_0EXUpdatesUpdate * _Nonnull update) {
        // we already checked using selection policy, so we don't need to check again
        return YES;
      } success:^(ABI40_0_0EXUpdatesUpdate * _Nullable update) {
        completion();
      } error:^(NSError * _Nonnull error) {
        completion();
      }];
    } else {
      completion();
    }
  } completionQueue:_loaderTaskQueue];
}

- (void)_launchWithCompletion:(void (^)(NSError * _Nullable error, BOOL success))completion
{
  ABI40_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI40_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:_config database:_database directory:_directory completionQueue:_loaderTaskQueue];
  _launcher = launcher;
  [launcher launchUpdateWithSelectionPolicy:_selectionPolicy completion:completion];
}

- (void)_loadRemoteUpdateWithCompletion:(void (^)(NSError * _Nullable error, ABI40_0_0EXUpdatesUpdate * _Nullable update))completion
{
  _remoteAppLoader = [[ABI40_0_0EXUpdatesRemoteAppLoader alloc] initWithConfig:_config database:_database directory:_directory completionQueue:_loaderTaskQueue];
  [_remoteAppLoader loadUpdateFromUrl:_config.updateUrl onManifest:^BOOL(ABI40_0_0EXUpdatesUpdate * _Nonnull update) {
    if ([self->_selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:self->_launcher.launchedUpdate]) {
      self->_isUpToDate = NO;
      if (self->_delegate) {
        dispatch_async(self->_delegateQueue, ^{
          [self->_delegate appLoaderTask:self didStartLoadingUpdate:update];
        });
      }
      return YES;
    } else {
      self->_isUpToDate = YES;
      return NO;
    }
  } success:^(ABI40_0_0EXUpdatesUpdate * _Nullable update) {
    completion(nil, update);
  } error:^(NSError *error) {
    completion(error, nil);
  }];
}

- (void)_handleRemoteUpdateLoaded:(nullable ABI40_0_0EXUpdatesUpdate *)update error:(nullable NSError *)error
{
  // If the app has not yet been launched (because the timer is still running),
  // create a new launcher so that we can launch with the newly downloaded update.
  // Otherwise, we've already launched. Send an event to the notify JS of the new update.

  dispatch_async(_loaderTaskQueue, ^{
    [self _stopTimer];

    if (update) {
      if (!self->_hasLaunched) {
        ABI40_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI40_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:self->_config database:self->_database directory:self->_directory completionQueue:self->_loaderTaskQueue];
        self->_candidateLauncher = launcher;
        [launcher launchUpdateWithSelectionPolicy:self->_selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
          if (success) {
            if (!self->_hasLaunched) {
              self->_launcher = self->_candidateLauncher;
              self->_isReadyToLaunch = YES;
              self->_isUpToDate = YES;
              [self _finishWithError:nil];
            }
          } else {
            [self _finishWithError:error];
            NSLog(@"Downloaded update but failed to relaunch: %@", error.localizedDescription);
          }
          [self _runReaper];
        }];
      } else {
        [self _didFinishBackgroundUpdateWithStatus:ABI40_0_0EXUpdatesBackgroundUpdateStatusUpdateAvailable manifest:update error:nil];
        [self _runReaper];
      }
    } else {
      // there's no update, so signal we're ready to launch
      [self _finishWithError:error];
      if (error) {
        [self _didFinishBackgroundUpdateWithStatus:ABI40_0_0EXUpdatesBackgroundUpdateStatusError manifest:nil error:error];
      } else {
        [self _didFinishBackgroundUpdateWithStatus:ABI40_0_0EXUpdatesBackgroundUpdateStatusNoUpdateAvailable manifest:nil error:nil];
      }
      [self _runReaper];
    }
  });
}

- (void)_didFinishBackgroundUpdateWithStatus:(ABI40_0_0EXUpdatesBackgroundUpdateStatus)status manifest:(nullable ABI40_0_0EXUpdatesUpdate *)manifest error:(nullable NSError *)error
{
  if (_delegate) {
    dispatch_async(_delegateQueue, ^{
      [self->_delegate appLoaderTask:self didFinishBackgroundUpdateWithStatus:status update:manifest error:error];
    });
  }
}

@end

NS_ASSUME_NONNULL_END

