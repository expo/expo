//  Copyright © 2020 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLauncherWithDatabase.h>
#import <EXUpdates/EXUpdatesAppLoaderTask.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesRemoteAppLoader.h>
#import <EXUpdates/EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const kEXUpdatesUpdateAvailableEventName = @"updateAvailable";
static NSString * const kEXUpdatesNoUpdateAvailableEventName = @"noUpdateAvailable";
static NSString * const kEXUpdatesErrorEventName = @"error";
static NSString * const kEXUpdatesAppLoaderTaskErrorDomain = @"EXUpdatesAppLoaderTask";

@interface EXUpdatesAppLoaderTask ()

@property (nonatomic, strong) EXUpdatesConfig *config;
@property (nonatomic, strong) EXUpdatesDatabase *database;
@property (nonatomic, strong) NSURL *directory;
@property (nonatomic, strong) id<EXUpdatesSelectionPolicy> selectionPolicy;
@property (nonatomic, strong) dispatch_queue_t delegateQueue;

@property (nonatomic, strong) id<EXUpdatesAppLauncher> launcher;
@property (nonatomic, strong) EXUpdatesEmbeddedAppLoader *embeddedAppLoader;
@property (nonatomic, strong) EXUpdatesRemoteAppLoader *remoteAppLoader;

@property (nonatomic, strong) id<EXUpdatesAppLauncher> candidateLauncher;
@property (nonatomic, strong) NSTimer *timer;
@property (nonatomic, assign) BOOL isReadyToLaunch;
@property (nonatomic, assign) BOOL isTimerFinished;
@property (nonatomic, assign) BOOL hasLaunched;
@property (nonatomic, strong) dispatch_queue_t loaderTaskQueue;


@end

@implementation EXUpdatesAppLoaderTask

- (instancetype)initWithConfig:(EXUpdatesConfig *)config
                      database:(EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               selectionPolicy:(id<EXUpdatesSelectionPolicy>)selectionPolicy
                 delegateQueue:(dispatch_queue_t)delegateQueue
{
  if (self = [super init]) {
    _config = config;
    _database = database;
    _directory = directory;
    _selectionPolicy = selectionPolicy;
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
                  didFinishWithError:[NSError errorWithDomain:kEXUpdatesAppLoaderTaskErrorDomain code:1030 userInfo:@{
                    NSLocalizedDescriptionKey: @"EXUpdatesAppLoaderTask was passed a configuration object with updates disabled. You should load updates from an embedded source rather than calling EXUpdatesAppLoaderTask, or enable updates in the configuration."
                  }]];
    });
    return;
  }

  if (!_config.updateUrl) {
    dispatch_async(_delegateQueue, ^{
      [self->_delegate appLoaderTask:self
                  didFinishWithError:[NSError errorWithDomain:kEXUpdatesAppLoaderTaskErrorDomain code:1030 userInfo:@{
                    NSLocalizedDescriptionKey: @"EXUpdatesAppLoaderTask was passed a configuration object with a null URL. You must pass a nonnull URL in order to use EXUpdatesAppLoaderTask to load updates."
                  }]];
    });
    return;
  }

  if (!_directory) {
    dispatch_async(_delegateQueue, ^{
      [self->_delegate appLoaderTask:self
                  didFinishWithError:[NSError errorWithDomain:kEXUpdatesAppLoaderTaskErrorDomain code:1030 userInfo:@{
                    NSLocalizedDescriptionKey: @"EXUpdatesAppLoaderTask directory must be nonnull."
                  }]];
    });
    return;
  }

  BOOL shouldCheckForUpdate = [EXUpdatesUtils shouldCheckForUpdateWithConfig:_config];
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
        self->_isReadyToLaunch = YES;
        [self _maybeFinish];
      }

      if (shouldCheckForUpdate) {
        [self _loadRemoteUpdateWithCompletion:^(NSError * _Nullable error, EXUpdatesUpdate * _Nullable update) {
          [self _handleRemoteUpdateLoaded:update error:error];
        }];
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
      if (self->_isReadyToLaunch && self->_launcher.launchAssetUrl) {
        [self->_delegate appLoaderTask:self didFinishWithLauncher:self->_launcher];
      } else {
        [self->_delegate appLoaderTask:self didFinishWithError:error ?: [NSError errorWithDomain:kEXUpdatesAppLoaderTaskErrorDomain code:1031 userInfo:@{
          NSLocalizedDescriptionKey: @"EXUpdatesAppLoaderTask encountered an unexpected error and could not launch an update."
        }]];
      }
    });
  }

  if (_timer) {
    [_timer invalidate];
  }
  _isTimerFinished = YES;
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

- (void)_loadEmbeddedUpdateWithCompletion:(void (^)(void))completion
{
  [EXUpdatesAppLauncherWithDatabase launchableUpdateWithSelectionPolicy:_selectionPolicy completion:^(NSError * _Nullable error, EXUpdatesUpdate * _Nullable launchableUpdate) {
    if ([self->_selectionPolicy shouldLoadNewUpdate:[EXUpdatesEmbeddedAppLoader embeddedManifest] withLaunchedUpdate:launchableUpdate]) {
      self->_embeddedAppLoader = [[EXUpdatesEmbeddedAppLoader alloc] initWithCompletionQueue:self->_loaderTaskQueue];
      [self->_embeddedAppLoader loadUpdateFromEmbeddedManifestWithSuccess:^(EXUpdatesUpdate * _Nullable update) {
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
  EXUpdatesAppLauncherWithDatabase *launcher = [[EXUpdatesAppLauncherWithDatabase alloc] initWithCompletionQueue:_loaderTaskQueue];
  _launcher = launcher;
  [launcher launchUpdateWithSelectionPolicy:_selectionPolicy completion:completion];
}

- (void)_loadRemoteUpdateWithCompletion:(void (^)(NSError * _Nullable error, EXUpdatesUpdate * _Nullable update))completion
{
  _remoteAppLoader = [[EXUpdatesRemoteAppLoader alloc] initWithCompletionQueue:_loaderTaskQueue];
  [_remoteAppLoader loadUpdateFromUrl:_config.updateUrl success:^(EXUpdatesUpdate * _Nullable update) {
    completion(nil, update);
  } error:^(NSError *error) {
    completion(error, nil);
  }];
}

- (void)_handleRemoteUpdateLoaded:(nullable EXUpdatesUpdate *)update error:(nullable NSError *)error
{
  // If the app has not yet been launched (because the timer is still running),
  // create a new launcher so that we can launch with the newly downloaded update.
  // Otherwise, we've already launched. Send an event to the notify JS of the new update.

  dispatch_async(_loaderTaskQueue, ^{
    if (self->_timer) {
      [self->_timer invalidate];
    }
    self->_isTimerFinished = YES;

    if (update) {
      if (!self->_hasLaunched) {
        EXUpdatesAppLauncherWithDatabase *launcher = [[EXUpdatesAppLauncherWithDatabase alloc] initWithCompletionQueue:self->_loaderTaskQueue];
        self->_candidateLauncher = launcher;
        [launcher launchUpdateWithSelectionPolicy:self->_selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
          if (success) {
            if (!self->_hasLaunched) {
              self->_launcher = self->_candidateLauncher;
              [self _finishWithError:nil];
            }
          } else {
            [self _finishWithError:error];
            NSLog(@"Downloaded update but failed to relaunch: %@", error.localizedDescription);
          }
        }];
      } else {
        [self _sendEventWithType:kEXUpdatesUpdateAvailableEventName
                            body:@{@"manifest": update.rawManifest}];
      }
    } else {
      // there's no update, so signal we're ready to launch
      [self _finishWithError:nil];
      if (error) {
        [self _sendEventWithType:kEXUpdatesErrorEventName
                            body:@{@"message": error.localizedDescription}];
      } else {
        [self _sendEventWithType:kEXUpdatesNoUpdateAvailableEventName body:@{}];
      }
    }
  });
}

- (void)_sendEventWithType:(NSString *)type body:(NSDictionary *)body
{
  if (_delegate) {
    dispatch_async(_delegateQueue, ^{
      [self->_delegate appLoaderTask:self didFireEventWithType:type body:body];
    });
  }
}

@end

NS_ASSUME_NONNULL_END

