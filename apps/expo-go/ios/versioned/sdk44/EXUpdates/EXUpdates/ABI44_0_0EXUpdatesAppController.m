//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppController+Internal.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppLauncher.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppLauncherNoDatabase.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppLauncherWithDatabase.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesErrorRecovery.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesReaper.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesSelectionPolicyFactory.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUtils.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesBuildData.h>
#import <ABI44_0_0React/ABI44_0_0RCTReloadCommand.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI44_0_0EXUpdatesAppControllerErrorDomain = @"ABI44_0_0EXUpdatesAppController";

static NSString * const ABI44_0_0EXUpdatesUpdateAvailableEventName = @"updateAvailable";
static NSString * const ABI44_0_0EXUpdatesNoUpdateAvailableEventName = @"noUpdateAvailable";
static NSString * const ABI44_0_0EXUpdatesErrorEventName = @"error";

@interface ABI44_0_0EXUpdatesAppController () <ABI44_0_0EXUpdatesErrorRecoveryDelegate>

@property (nonatomic, readwrite, strong) ABI44_0_0EXUpdatesConfig *config;
@property (nonatomic, readwrite, strong, nullable) id<ABI44_0_0EXUpdatesAppLauncher> launcher;
@property (nonatomic, readwrite, strong) ABI44_0_0EXUpdatesDatabase *database;
@property (nonatomic, readwrite, strong) ABI44_0_0EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readwrite, strong) ABI44_0_0EXUpdatesSelectionPolicy *defaultSelectionPolicy;
@property (nonatomic, readwrite, strong) ABI44_0_0EXUpdatesErrorRecovery *errorRecovery;
@property (nonatomic, readwrite, strong) dispatch_queue_t controllerQueue;
@property (nonatomic, readwrite, strong) dispatch_queue_t assetFilesQueue;

@property (nonatomic, readwrite, strong) NSURL *updatesDirectory;

@property (nonatomic, strong) ABI44_0_0EXUpdatesAppLoaderTask *loaderTask;
@property (nonatomic, strong) id<ABI44_0_0EXUpdatesAppLauncher> candidateLauncher;
@property (nonatomic, assign) BOOL hasLaunched;

@property (nonatomic, assign) BOOL isStarted;
@property (nonatomic, assign) BOOL isEmergencyLaunch;

@property (nonatomic, readwrite, assign) ABI44_0_0EXUpdatesRemoteLoadStatus remoteLoadStatus;

@end

@implementation ABI44_0_0EXUpdatesAppController

+ (instancetype)sharedInstance
{
  static ABI44_0_0EXUpdatesAppController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [[ABI44_0_0EXUpdatesAppController alloc] init];
    }
  });
  return theController;
}

- (instancetype)init
{
  if (self = [super init]) {
    _config = [ABI44_0_0EXUpdatesConfig configWithExpoPlist];
    _database = [[ABI44_0_0EXUpdatesDatabase alloc] init];
    _defaultSelectionPolicy = [ABI44_0_0EXUpdatesSelectionPolicyFactory filterAwarePolicyWithRuntimeVersion:[ABI44_0_0EXUpdatesUtils getRuntimeVersionWithConfig:_config]];
    _errorRecovery = [ABI44_0_0EXUpdatesErrorRecovery new];
    _errorRecovery.delegate = self;
    _assetFilesQueue = dispatch_queue_create("expo.controller.AssetFilesQueue", DISPATCH_QUEUE_SERIAL);
    _controllerQueue = dispatch_queue_create("expo.controller.ControllerQueue", DISPATCH_QUEUE_SERIAL);
    _isStarted = NO;
    _remoteLoadStatus = ABI44_0_0EXUpdatesRemoteLoadStatusIdle;
  }
  return self;
}

- (void)setConfiguration:(NSDictionary *)configuration
{
  if (_isStarted) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"ABI44_0_0EXUpdatesAppController:setConfiguration should not be called after start"
                                 userInfo:@{}];
  }
  [_config loadConfigFromDictionary:configuration];
  [self resetSelectionPolicyToDefault];
}

- (ABI44_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  if (!_selectionPolicy) {
    _selectionPolicy = _defaultSelectionPolicy;
  }
  return _selectionPolicy;
}

- (void)setNextSelectionPolicy:(ABI44_0_0EXUpdatesSelectionPolicy *)nextSelectionPolicy
{
  _selectionPolicy = nextSelectionPolicy;
}

- (void)resetSelectionPolicyToDefault
{
  _selectionPolicy = nil;
}

- (void)start
{
  NSAssert(!_isStarted, @"ABI44_0_0EXUpdatesAppController:start should only be called once per instance");

  if (!_config.isEnabled) {
    ABI44_0_0EXUpdatesAppLauncherNoDatabase *launcher = [[ABI44_0_0EXUpdatesAppLauncherNoDatabase alloc] init];
    _launcher = launcher;
    [launcher launchUpdateWithConfig:_config];

    if (_delegate) {
      [_delegate appController:self didStartWithSuccess:self.launchAssetUrl != nil];
    }

    return;
  }

  if (!_config.updateUrl) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"expo-updates is enabled, but no valid URL is configured under ABI44_0_0EXUpdatesURL. If you are making a release build for the first time, make sure you have run `expo publish` at least once."
                                 userInfo:@{}];
  }
  if (!_config.scopeKey) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"expo-updates was configured with no scope key. Make sure a valid URL is configured under ABI44_0_0EXUpdatesURL."
                                 userInfo:@{}];
  }

  _isStarted = YES;

  NSError *fsError;
  [self initializeUpdatesDirectoryWithError:&fsError];
  if (fsError) {
    [self _emergencyLaunchWithFatalError:fsError];
    return;
  }

  NSError *dbError;
  if (![self initializeUpdatesDatabaseWithError:&dbError]) {
    [self _emergencyLaunchWithFatalError:dbError];
    return;
  }

  [ABI44_0_0EXUpdatesBuildData ensureBuildDataIsConsistentAsync:_database config:_config];

  [_errorRecovery startMonitoring];

  _loaderTask = [[ABI44_0_0EXUpdatesAppLoaderTask alloc] initWithConfig:_config
                                                      database:_database
                                                     directory:_updatesDirectory
                                               selectionPolicy:self.selectionPolicy
                                                 delegateQueue:_controllerQueue];
  _loaderTask.delegate = self;
  [_loaderTask start];
}

- (void)startAndShowLaunchScreen:(UIWindow *)window
{
  UIView *view = nil;
  NSBundle *mainBundle = [NSBundle mainBundle];
  NSString *launchScreen = (NSString *)[mainBundle objectForInfoDictionaryKey:@"UILaunchStoryboardName"] ?: @"LaunchScreen";
  
  if ([mainBundle pathForResource:launchScreen ofType:@"nib"] != nil) {
    NSArray *views = [mainBundle loadNibNamed:launchScreen owner:self options:nil];
    view = views.firstObject;
    view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  } else if ([mainBundle pathForResource:launchScreen ofType:@"storyboard"] != nil ||
             [mainBundle pathForResource:launchScreen ofType:@"storyboardc"] != nil) {
    UIStoryboard *launchScreenStoryboard = [UIStoryboard storyboardWithName:launchScreen bundle:nil];
    UIViewController *viewController = [launchScreenStoryboard instantiateInitialViewController];
    view = viewController.view;
    viewController.view = nil;
  } else {
    NSLog(@"Launch screen could not be loaded from a .xib or .storyboard. Unexpected loading behavior may occur.");
    view = [UIView new];
    view.backgroundColor = [UIColor whiteColor];
  }
  
  window.rootViewController.view = view;

  [self start];
}

- (void)requestRelaunchWithCompletion:(ABI44_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  ABI44_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI44_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:_config database:_database directory:_updatesDirectory completionQueue:_controllerQueue];
  _candidateLauncher = launcher;
  [launcher launchUpdateWithSelectionPolicy:self.selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
    if (success) {
      self->_launcher = self->_candidateLauncher;
      completion(YES);
      [self->_errorRecovery startMonitoring];
      ABI44_0_0RCTReloadCommandSetBundleURL(launcher.launchAssetUrl);
      ABI44_0_0RCTTriggerReloadCommandListeners(@"Requested by JavaScript - Updates.reloadAsync()");
      [self runReaper];
    } else {
      NSLog(@"Failed to relaunch: %@", error.localizedDescription);
      completion(NO);
    }
  }];
}

- (nullable ABI44_0_0EXUpdatesUpdate *)launchedUpdate
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

# pragma mark - ABI44_0_0EXUpdatesAppLoaderTaskDelegate

- (BOOL)appLoaderTask:(ABI44_0_0EXUpdatesAppLoaderTask *)appLoaderTask didLoadCachedUpdate:(nonnull ABI44_0_0EXUpdatesUpdate *)update
{
  return YES;
}

- (void)appLoaderTask:(ABI44_0_0EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(ABI44_0_0EXUpdatesUpdate *)update
{
  _remoteLoadStatus = ABI44_0_0EXUpdatesRemoteLoadStatusLoading;
}

- (void)appLoaderTask:(ABI44_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<ABI44_0_0EXUpdatesAppLauncher>)launcher isUpToDate:(BOOL)isUpToDate
{
  // if isUpToDate is false, that means a remote update is still loading in the background (this
  // method was called with a cached update because the timer ran out) so don't update the status
  if (_remoteLoadStatus == ABI44_0_0EXUpdatesRemoteLoadStatusLoading && isUpToDate) {
    _remoteLoadStatus = ABI44_0_0EXUpdatesRemoteLoadStatusIdle;
  }
  _launcher = launcher;
  if (self->_delegate) {
    [ABI44_0_0EXUpdatesUtils runBlockOnMainThread:^{
      [self->_delegate appController:self didStartWithSuccess:YES];
    }];
  }
}

- (void)appLoaderTask:(ABI44_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error
{
  [self _emergencyLaunchWithFatalError:error];
}

- (void)appLoaderTask:(ABI44_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishBackgroundUpdateWithStatus:(ABI44_0_0EXUpdatesBackgroundUpdateStatus)status update:(nullable ABI44_0_0EXUpdatesUpdate *)update error:(nullable NSError *)error
{
  if (status == ABI44_0_0EXUpdatesBackgroundUpdateStatusError) {
    _remoteLoadStatus = ABI44_0_0EXUpdatesRemoteLoadStatusIdle;
    NSAssert(error != nil, @"Background update with error status must have a nonnull error object");
    [ABI44_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI44_0_0EXUpdatesErrorEventName body:@{@"message": error.localizedDescription}];
  } else if (status == ABI44_0_0EXUpdatesBackgroundUpdateStatusUpdateAvailable) {
    _remoteLoadStatus = ABI44_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded;
    NSAssert(update != nil, @"Background update with error status must have a nonnull update object");
    [ABI44_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI44_0_0EXUpdatesUpdateAvailableEventName body:@{@"manifest": update.manifest.rawManifestJSON}];
  } else if (status == ABI44_0_0EXUpdatesBackgroundUpdateStatusNoUpdateAvailable) {
    _remoteLoadStatus = ABI44_0_0EXUpdatesRemoteLoadStatusIdle;
    [ABI44_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI44_0_0EXUpdatesNoUpdateAvailableEventName body:@{}];
  }
  [_errorRecovery notifyNewRemoteLoadStatus:_remoteLoadStatus];
}

# pragma mark - ABI44_0_0EXUpdatesAppController+Internal

- (BOOL)initializeUpdatesDirectoryWithError:(NSError ** _Nullable)error
{
  _updatesDirectory = [ABI44_0_0EXUpdatesUtils initializeUpdatesDirectoryWithError:error];
  return _updatesDirectory != nil;
}

- (BOOL)initializeUpdatesDatabaseWithError:(NSError ** _Nullable)error
{
  __block NSError *dbError;
  dispatch_semaphore_t dbSemaphore = dispatch_semaphore_create(0);
  dispatch_async(_database.databaseQueue, ^{
    [self->_database openDatabaseInDirectory:self->_updatesDirectory withError:&dbError];
    dispatch_semaphore_signal(dbSemaphore);
  });

  dispatch_semaphore_wait(dbSemaphore, DISPATCH_TIME_FOREVER);
  if (dbError && error) {
    *error = dbError;
  }
  return dbError == nil;
}

- (void)setDefaultSelectionPolicy:(ABI44_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  _defaultSelectionPolicy = selectionPolicy;
}

- (void)setLauncher:(nullable id<ABI44_0_0EXUpdatesAppLauncher>)launcher
{
  _launcher = launcher;
}

- (void)setConfigurationInternal:(ABI44_0_0EXUpdatesConfig *)configuration
{
  _config = configuration;
}

- (void)setIsStarted:(BOOL)isStarted
{
  _isStarted = isStarted;
}

- (void)runReaper
{
  if (_launcher.launchedUpdate) {
    [ABI44_0_0EXUpdatesReaper reapUnusedUpdatesWithConfig:_config
                                        database:_database
                                       directory:_updatesDirectory
                                 selectionPolicy:self.selectionPolicy
                                  launchedUpdate:_launcher.launchedUpdate];
  }
}

# pragma mark - ABI44_0_0EXUpdatesErrorRecoveryDelegate

- (void)relaunchWithCompletion:(ABI44_0_0EXUpdatesAppLauncherCompletionBlock)completion
{
  ABI44_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI44_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:_config database:_database directory:_updatesDirectory completionQueue:_controllerQueue];
  _candidateLauncher = launcher;
  [launcher launchUpdateWithSelectionPolicy:self.selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
    if (success) {
      self->_launcher = self->_candidateLauncher;
      [self->_errorRecovery startMonitoring];
      ABI44_0_0RCTReloadCommandSetBundleURL(launcher.launchAssetUrl);
      ABI44_0_0RCTTriggerReloadCommandListeners(@"Relaunch after fatal error");
      completion(nil, YES);
    } else {
      completion(error, NO);
    }
  }];
}

- (void)loadRemoteUpdate
{
  if (_loaderTask && _loaderTask.isRunning) {
    return;
  }

  _remoteLoadStatus = ABI44_0_0EXUpdatesRemoteLoadStatusLoading;
  ABI44_0_0EXUpdatesAppLoader *remoteAppLoader = [[ABI44_0_0EXUpdatesRemoteAppLoader alloc] initWithConfig:_config database:_database directory:_updatesDirectory completionQueue:_controllerQueue];
  [remoteAppLoader loadUpdateFromUrl:_config.updateUrl onManifest:^BOOL(ABI44_0_0EXUpdatesUpdate *update) {
    return [self->_selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:self.launchedUpdate filters:update.manifestFilters];
  } asset:^(ABI44_0_0EXUpdatesAsset *asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    // do nothing for now
  } success:^(ABI44_0_0EXUpdatesUpdate * _Nullable update) {
    self->_remoteLoadStatus = update ? ABI44_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded : ABI44_0_0EXUpdatesRemoteLoadStatusIdle;
    [self->_errorRecovery notifyNewRemoteLoadStatus:self->_remoteLoadStatus];
  } error:^(NSError *error) {
    self->_remoteLoadStatus = ABI44_0_0EXUpdatesRemoteLoadStatusIdle;
    [self->_errorRecovery notifyNewRemoteLoadStatus:self->_remoteLoadStatus];
  }];
}

- (void)markFailedLaunchForLaunchedUpdate
{
  if (_isEmergencyLaunch) {
    return;
  }
  dispatch_async(_database.databaseQueue, ^{
    ABI44_0_0EXUpdatesUpdate *launchedUpdate = self.launchedUpdate;
    if (!launchedUpdate) {
      return;
    }
    NSError *error;
    [self->_database incrementFailedLaunchCountForUpdate:launchedUpdate error:&error];
    if (error) {
      NSLog(@"Unable to mark update as failed in the local DB: %@", error.localizedDescription);
    }
  });
}

- (void)markSuccessfulLaunchForLaunchedUpdate
{
  if (_isEmergencyLaunch) {
    return;
  }
  dispatch_async(_database.databaseQueue, ^{
    ABI44_0_0EXUpdatesUpdate *launchedUpdate = self.launchedUpdate;
    if (!launchedUpdate) {
      return;
    }
    NSError *error;
    [self->_database incrementSuccessfulLaunchCountForUpdate:launchedUpdate error:&error];
    if (error) {
      NSLog(@"Failed to increment successful launch count for update: %@", error.localizedDescription);
    }
  });
}

- (void)throwException:(NSException *)exception
{
  @throw exception;
}

# pragma mark - internal

- (void)_emergencyLaunchWithFatalError:(NSError *)error
{
  _isEmergencyLaunch = YES;

  ABI44_0_0EXUpdatesAppLauncherNoDatabase *launcher = [[ABI44_0_0EXUpdatesAppLauncherNoDatabase alloc] init];
  _launcher = launcher;
  [launcher launchUpdateWithConfig:_config];

  if (_delegate) {
    [ABI44_0_0EXUpdatesUtils runBlockOnMainThread:^{
      [self->_delegate appController:self didStartWithSuccess:self.launchAssetUrl != nil];
    }];
  }

  [_errorRecovery writeErrorOrExceptionToLog:error];
}

@end

NS_ASSUME_NONNULL_END
