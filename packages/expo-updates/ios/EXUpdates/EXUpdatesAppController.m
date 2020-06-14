//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesAppLauncher.h>
#import <EXUpdates/EXUpdatesAppLauncherNoDatabase.h>
#import <EXUpdates/EXUpdatesAppLauncherWithDatabase.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesRemoteAppLoader.h>
#import <EXUpdates/EXUpdatesReaper.h>
#import <EXUpdates/EXUpdatesSelectionPolicyNewest.h>
#import <EXUpdates/EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const kEXUpdatesUpdateAvailableEventName = @"updateAvailable";
static NSString * const kEXUpdatesNoUpdateAvailableEventName = @"noUpdateAvailable";
static NSString * const kEXUpdatesErrorEventName = @"error";
static NSString * const kEXUpdatesAppControllerErrorDomain = @"EXUpdatesAppController";

@interface EXUpdatesAppController ()

@property (nonatomic, readwrite, strong) id<EXUpdatesAppLauncher> launcher;
@property (nonatomic, readwrite, strong) EXUpdatesDatabase *database;
@property (nonatomic, readwrite, strong) id<EXUpdatesSelectionPolicy> selectionPolicy;
@property (nonatomic, readwrite, strong) EXUpdatesEmbeddedAppLoader *embeddedAppLoader;
@property (nonatomic, readwrite, strong) EXUpdatesRemoteAppLoader *remoteAppLoader;
@property (nonatomic, readwrite, strong) dispatch_queue_t assetFilesQueue;

@property (nonatomic, readwrite, strong) NSURL *updatesDirectory;

@property (nonatomic, strong) id<EXUpdatesAppLauncher> candidateLauncher;
@property (nonatomic, strong) NSTimer *timer;
@property (nonatomic, assign) BOOL isReadyToLaunch;
@property (nonatomic, assign) BOOL isTimerFinished;
@property (nonatomic, assign) BOOL hasLaunched;
@property (nonatomic, strong) dispatch_queue_t controllerQueue;

@property (nonatomic, assign) BOOL isStarted;
@property (nonatomic, assign) BOOL isEmergencyLaunch;

@end

@implementation EXUpdatesAppController

+ (instancetype)sharedInstance
{
  static EXUpdatesAppController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [[EXUpdatesAppController alloc] init];
    }
  });
  return theController;
}

- (instancetype)init
{
  if (self = [super init]) {
    _database = [[EXUpdatesDatabase alloc] init];
    _selectionPolicy = [[EXUpdatesSelectionPolicyNewest alloc] init];
    _assetFilesQueue = dispatch_queue_create("expo.controller.AssetFilesQueue", DISPATCH_QUEUE_SERIAL);
    _controllerQueue = dispatch_queue_create("expo.controller.ControllerQueue", DISPATCH_QUEUE_SERIAL);
    _isReadyToLaunch = NO;
    _isTimerFinished = NO;
    _hasLaunched = NO;
    _isStarted = NO;
  }
  return self;
}

- (void)setConfiguration:(NSDictionary *)configuration
{
  NSAssert(!_updatesDirectory, @"EXUpdatesAppController:setConfiguration should not be called after start");
  [EXUpdatesConfig.sharedInstance loadConfigFromDictionary:configuration];
}

- (void)start
{
  NSAssert(!_updatesDirectory, @"EXUpdatesAppController:start should only be called once per instance");

  if (!EXUpdatesConfig.sharedInstance.isEnabled) {
    EXUpdatesAppLauncherNoDatabase *launcher = [[EXUpdatesAppLauncherNoDatabase alloc] init];
    _launcher = launcher;
    [launcher launchUpdate];

    if (_delegate) {
      [_delegate appController:self didStartWithSuccess:self.launchAssetUrl != nil];
    }

    return;
  }

  if (!EXUpdatesConfig.sharedInstance.updateUrl) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"expo-updates is enabled, but no valid URL is configured under EXUpdatesURL. If you are making a release build for the first time, make sure you have run `expo publish` at least once."
                                 userInfo:@{}];
  }

  _isStarted = YES;

  NSError *fsError;
  _updatesDirectory = [EXUpdatesUtils initializeUpdatesDirectoryWithError:&fsError];
  if (fsError) {
    [self _emergencyLaunchWithFatalError:fsError];
    return;
  }

  __block BOOL dbSuccess;
  __block NSError *dbError;
  dispatch_semaphore_t dbSemaphore = dispatch_semaphore_create(0);
  dispatch_async(_database.databaseQueue, ^{
    dbSuccess = [self->_database openDatabaseWithError:&dbError];
    dispatch_semaphore_signal(dbSemaphore);
  });

  BOOL shouldCheckForUpdate = [EXUpdatesUtils shouldCheckForUpdate];
  NSNumber *launchWaitMs = [EXUpdatesConfig sharedInstance].launchWaitMs;
  if ([launchWaitMs isEqualToNumber:@(0)] || !shouldCheckForUpdate) {
    self->_isTimerFinished = YES;
  } else {
    NSDate *fireDate = [NSDate dateWithTimeIntervalSinceNow:[launchWaitMs doubleValue] / 1000];
    self->_timer = [[NSTimer alloc] initWithFireDate:fireDate interval:0 target:self selector:@selector(_timerDidFire) userInfo:nil repeats:NO];
    [[NSRunLoop mainRunLoop] addTimer:self->_timer forMode:NSDefaultRunLoopMode];
  }

  dispatch_semaphore_wait(dbSemaphore, DISPATCH_TIME_FOREVER);
  if (!dbSuccess) {
    if (self->_timer) {
      [self->_timer invalidate];
    }
    [self _emergencyLaunchWithFatalError:dbError];
    return;
  }

  [self _loadEmbeddedUpdateWithCompletion:^{
    [self _launchWithCompletion:^(NSError * _Nullable error, BOOL success) {
      if (!success) {
        [self _emergencyLaunchWithFatalError:error ?: [NSError errorWithDomain:kEXUpdatesAppControllerErrorDomain
                                                                     code:1010
                                                                 userInfo:@{NSLocalizedDescriptionKey: @"Failed to find or load launch asset"}]];
      } else {
        self->_isReadyToLaunch = YES;
        [self _maybeFinish];
      }

      if (shouldCheckForUpdate) {
        [self _loadRemoteUpdateWithCompletion:^(NSError * _Nullable error, EXUpdatesUpdate * _Nullable update) {
          [self _handleRemoteUpdateLoaded:update error:error];
        }];
      } else {
        [self _runReaper];
      }
    }];
  }];
}

- (void)startAndShowLaunchScreen:(UIWindow *)window
{
  NSBundle *mainBundle = [NSBundle mainBundle];
  UIViewController *rootViewController = [UIViewController new];
  NSString *launchScreen = (NSString *)[mainBundle objectForInfoDictionaryKey:@"UILaunchStoryboardName"] ?: @"LaunchScreen";
  
  if ([mainBundle pathForResource:launchScreen ofType:@"nib"] != nil) {
    NSArray *views = [mainBundle loadNibNamed:launchScreen owner:self options:nil];
    rootViewController.view = views.firstObject;
    rootViewController.view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  } else if ([mainBundle pathForResource:launchScreen ofType:@"storyboard"] != nil) {
    UIStoryboard *launchScreenStoryboard = [UIStoryboard storyboardWithName:launchScreen bundle:nil];
    rootViewController = [launchScreenStoryboard instantiateInitialViewController];
  } else {
    NSLog(@"Launch screen could not be loaded from a .xib or .storyboard. Unexpected loading behavior may occur.");
    UIView *view = [UIView new];
    view.backgroundColor = [UIColor whiteColor];
    rootViewController.view = view;
  }
  
  window.rootViewController = rootViewController;
  [window makeKeyAndVisible];

  [self start];
}

- (void)requestRelaunchWithCompletion:(EXUpdatesAppControllerRelaunchCompletionBlock)completion
{
  if (_bridge) {
    EXUpdatesAppLauncherWithDatabase *launcher = [[EXUpdatesAppLauncherWithDatabase alloc] initWithCompletionQueue:_controllerQueue];
    _candidateLauncher = launcher;
    [launcher launchUpdateWithSelectionPolicy:self->_selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
      if (success) {
        self->_launcher = self->_candidateLauncher;
        completion(YES);
        [self->_bridge reload];
        [self _runReaper];
      } else {
        NSLog(@"Failed to relaunch: %@", error.localizedDescription);
        completion(NO);
      }
    }];
  } else {
    NSLog(@"EXUpdatesAppController: Failed to reload because bridge was nil. Did you set the bridge property on the controller singleton?");
    completion(NO);
  }
}

- (nullable EXUpdatesUpdate *)launchedUpdate
{
  return _launcher.launchedUpdate ?: nil;
}

- (nullable NSURL *)launchAssetUrl
{
  return _launcher.launchAssetUrl ?: nil;
}

- (nullable NSDictionary *)assetFilesMap
{
  return _launcher.assetFilesMap ?: nil;
}

- (BOOL)isUsingEmbeddedAssets
{
  if (!_launcher) {
    return YES;
  }
  return _launcher.isUsingEmbeddedAssets;
}

# pragma mark - internal

- (void)_maybeFinish
{
  if (!_isTimerFinished || !_isReadyToLaunch) {
    // too early, bail out
    return;
  }
  if (_hasLaunched) {
    // we've already fired once, don't do it again
    return;
  }

  _hasLaunched = YES;
  if (!self.launchAssetUrl) {
    [self _emergencyLaunchWithFatalError:[NSError errorWithDomain:kEXUpdatesAppControllerErrorDomain
                                                             code:1020
                                                         userInfo:@{NSLocalizedDescriptionKey: @"Unexpectedly tried to launch without a valid launchAssetUrl"}]];
    return;
  }

  if (self->_delegate) {
    [EXUpdatesUtils runBlockOnMainThread:^{
      [self->_delegate appController:self didStartWithSuccess:YES];
    }];
  }
}

- (void)_timerDidFire
{
  dispatch_async(_controllerQueue, ^{
    self->_isTimerFinished = YES;
    [self _maybeFinish];
  });
}

- (void)_loadEmbeddedUpdateWithCompletion:(void (^)(void))completion
{
  [EXUpdatesAppLauncherWithDatabase launchableUpdateWithSelectionPolicy:_selectionPolicy completion:^(NSError * _Nullable error, EXUpdatesUpdate * _Nullable launchableUpdate) {
    if ([self->_selectionPolicy shouldLoadNewUpdate:[EXUpdatesEmbeddedAppLoader embeddedManifest] withLaunchedUpdate:launchableUpdate]) {
      self->_embeddedAppLoader = [[EXUpdatesEmbeddedAppLoader alloc] initWithCompletionQueue:self->_controllerQueue];
      [self->_embeddedAppLoader loadUpdateFromEmbeddedManifestWithSuccess:^(EXUpdatesUpdate * _Nullable update) {
        completion();
      } error:^(NSError * _Nonnull error) {
        completion();
      }];
    } else {
      completion();
    }
  } completionQueue:_controllerQueue];
}

- (void)_launchWithCompletion:(void (^)(NSError * _Nullable error, BOOL success))completion
{
  EXUpdatesAppLauncherWithDatabase *launcher = [[EXUpdatesAppLauncherWithDatabase alloc] initWithCompletionQueue:_controllerQueue];
  _launcher = launcher;
  [launcher launchUpdateWithSelectionPolicy:_selectionPolicy completion:completion];
}

- (void)_loadRemoteUpdateWithCompletion:(void (^)(NSError * _Nullable error, EXUpdatesUpdate * _Nullable update))completion
{
  _remoteAppLoader = [[EXUpdatesRemoteAppLoader alloc] initWithCompletionQueue:_controllerQueue];
  [_remoteAppLoader loadUpdateFromUrl:[EXUpdatesConfig sharedInstance].updateUrl success:^(EXUpdatesUpdate * _Nullable update) {
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

  dispatch_async(_controllerQueue, ^{
    if (self->_timer) {
      [self->_timer invalidate];
    }
    self->_isTimerFinished = YES;

    if (update) {
      if (!self->_hasLaunched) {
        EXUpdatesAppLauncherWithDatabase *launcher = [[EXUpdatesAppLauncherWithDatabase alloc] initWithCompletionQueue:self->_controllerQueue];
        self->_candidateLauncher = launcher;
        [launcher launchUpdateWithSelectionPolicy:self->_selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
          if (success) {
            if (!self->_hasLaunched) {
              self->_launcher = self->_candidateLauncher;
              [self _maybeFinish];
            }
          } else {
            [self _maybeFinish];
            NSLog(@"Downloaded update but failed to relaunch: %@", error.localizedDescription);
          }

          [self _runReaper];
        }];
      } else {
        [EXUpdatesUtils sendEventToBridge:self->_bridge
                                 withType:kEXUpdatesUpdateAvailableEventName
                                     body:@{@"manifest": update.rawManifest}];
        [self _runReaper];
      }
    } else {
      // there's no update, so signal we're ready to launch
      [self _maybeFinish];
      if (error) {
        [EXUpdatesUtils sendEventToBridge:self->_bridge
                                 withType:kEXUpdatesErrorEventName
                                     body:@{@"message": error.localizedDescription}];
      } else {
        [EXUpdatesUtils sendEventToBridge:self->_bridge withType:kEXUpdatesNoUpdateAvailableEventName body:@{}];
      }

      [self _runReaper];
    }
  });
}

- (void)_runReaper
{
  if (_launcher.launchedUpdate) {
    [EXUpdatesReaper reapUnusedUpdatesWithSelectionPolicy:self->_selectionPolicy
                                           launchedUpdate:self->_launcher.launchedUpdate];
  }
}

- (void)_emergencyLaunchWithFatalError:(NSError *)error
{
  if (_timer) {
    [_timer invalidate];
  }

  _isEmergencyLaunch = YES;
  _hasLaunched = YES;

  EXUpdatesAppLauncherNoDatabase *launcher = [[EXUpdatesAppLauncherNoDatabase alloc] init];
  _launcher = launcher;
  [launcher launchUpdateWithFatalError:error];

  if (_delegate) {
    [EXUpdatesUtils runBlockOnMainThread:^{
      [self->_delegate appController:self didStartWithSuccess:self.launchAssetUrl != nil];
    }];
  }
}

@end

NS_ASSUME_NONNULL_END
