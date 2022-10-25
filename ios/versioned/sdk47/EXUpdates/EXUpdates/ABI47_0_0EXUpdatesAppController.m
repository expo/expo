//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAppController+Internal.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAppLauncher.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAppLauncherNoDatabase.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAppLauncherWithDatabase.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesErrorRecovery.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesReaper.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesSelectionPolicyFactory.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesUtils.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesBuildData.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDefines.h>
#import <ABI47_0_0React/ABI47_0_0RCTReloadCommand.h>

#if __has_include(<ABI47_0_0EXUpdates/ABI47_0_0EXUpdates-Swift.h>)
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdates-Swift.h>
#else
#import "ABI47_0_0EXUpdates-Swift.h"
#endif

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI47_0_0EXUpdatesAppControllerErrorDomain = @"ABI47_0_0EXUpdatesAppController";

static NSString * const ABI47_0_0EXUpdatesUpdateAvailableEventName = @"updateAvailable";
static NSString * const ABI47_0_0EXUpdatesNoUpdateAvailableEventName = @"noUpdateAvailable";
static NSString * const ABI47_0_0EXUpdatesErrorEventName = @"error";

@interface ABI47_0_0EXUpdatesAppController () <ABI47_0_0EXUpdatesErrorRecoveryDelegate>

@property (nonatomic, readwrite, strong) ABI47_0_0EXUpdatesConfig *config;
@property (nonatomic, readwrite, strong, nullable) id<ABI47_0_0EXUpdatesAppLauncher> launcher;
@property (nonatomic, readwrite, strong) ABI47_0_0EXUpdatesDatabase *database;
@property (nonatomic, readwrite, strong) ABI47_0_0EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readwrite, strong) ABI47_0_0EXUpdatesSelectionPolicy *defaultSelectionPolicy;
@property (nonatomic, readwrite, strong) ABI47_0_0EXUpdatesErrorRecovery *errorRecovery;
@property (nonatomic, readwrite, strong) dispatch_queue_t controllerQueue;
@property (nonatomic, readwrite, strong) dispatch_queue_t assetFilesQueue;

@property (nonatomic, readwrite, strong) NSURL *updatesDirectory;

@property (nonatomic, strong) ABI47_0_0EXUpdatesAppLoaderTask *loaderTask;
@property (nonatomic, strong) id<ABI47_0_0EXUpdatesAppLauncher> candidateLauncher;
@property (nonatomic, assign) BOOL hasLaunched;

@property (nonatomic, assign) BOOL isStarted;
@property (nonatomic, assign) BOOL isEmergencyLaunch;

@property (nonatomic, readwrite, assign) ABI47_0_0EXUpdatesRemoteLoadStatus remoteLoadStatus;

@property (nonatomic, strong) ABI47_0_0EXUpdatesLogger *logger;

@end


/**
 * Main entry point to expo-updates in normal release builds (development clients, including Expo
 * Go, use a different entry point). Singleton that keeps track of updates state, holds references
 * to instances of other updates classes, and is the central hub for all updates-related tasks.
 *
 * The `start` method in this class should be invoked early in the application lifecycle, via
 * ExpoUpdatesReactDelegateHandler. It delegates to an instance of ABI47_0_0EXUpdatesAppLoaderTask to start
 * the process of loading and launching an update, then responds appropriately depending on the
 * callbacks that are invoked.
 *
 * This class also provides getter methods to access information about the updates state, which are
 * used by the exported ABI47_0_0EXUpdatesModule through ABI47_0_0EXUpdatesService. Such information includes
 * references to: the database, the ABI47_0_0EXUpdatesConfig object, the path on disk to the updates
 * directory, any currently active ABI47_0_0EXUpdatesAppLoaderTask, the current ABI47_0_0EXUpdatesSelectionPolicy, the
 * error recovery handler, and the current launched update. This class is intended to be the source
 * of truth for these objects, so other classes shouldn't retain any of them indefinitely.
 */
@implementation ABI47_0_0EXUpdatesAppController

+ (instancetype)sharedInstance
{
  static ABI47_0_0EXUpdatesAppController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [[ABI47_0_0EXUpdatesAppController alloc] init];
    }
  });

  return theController;
}

- (instancetype)init
{
  if (self = [super init]) {
    _config = [ABI47_0_0EXUpdatesConfig configWithExpoPlist];
    _database = [[ABI47_0_0EXUpdatesDatabase alloc] init];
    _defaultSelectionPolicy = [ABI47_0_0EXUpdatesSelectionPolicyFactory filterAwarePolicyWithRuntimeVersion:[ABI47_0_0EXUpdatesUtils getRuntimeVersionWithConfig:_config]];
    _errorRecovery = [ABI47_0_0EXUpdatesErrorRecovery new];
    _errorRecovery.delegate = self;
    _assetFilesQueue = dispatch_queue_create("expo.controller.AssetFilesQueue", DISPATCH_QUEUE_SERIAL);
    _controllerQueue = dispatch_queue_create("expo.controller.ControllerQueue", DISPATCH_QUEUE_SERIAL);
    _isStarted = NO;
    _remoteLoadStatus = ABI47_0_0EXUpdatesRemoteLoadStatusIdle;
    _logger = [ABI47_0_0EXUpdatesLogger new];
    [_logger info:@"ABI47_0_0EXUpdatesAppController sharedInstance created"];
  }
  return self;
}

- (void)setConfiguration:(NSDictionary *)configuration
{
  if (_isStarted) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"ABI47_0_0EXUpdatesAppController:setConfiguration should not be called after start"
                                 userInfo:@{}];
  }
  [_config loadConfigFromDictionary:configuration];
  [self resetSelectionPolicyToDefault];
}

- (ABI47_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  if (!_selectionPolicy) {
    _selectionPolicy = _defaultSelectionPolicy;
  }
  return _selectionPolicy;
}

- (void)setNextSelectionPolicy:(ABI47_0_0EXUpdatesSelectionPolicy *)nextSelectionPolicy
{
  _selectionPolicy = nextSelectionPolicy;
}

- (void)resetSelectionPolicyToDefault
{
  _selectionPolicy = nil;
}

- (void)start
{
  NSAssert(!_isStarted, @"ABI47_0_0EXUpdatesAppController:start should only be called once per instance");

  if (!_config.isEnabled) {
    ABI47_0_0EXUpdatesAppLauncherNoDatabase *launcher = [[ABI47_0_0EXUpdatesAppLauncherNoDatabase alloc] init];
    _launcher = launcher;
    [launcher launchUpdateWithConfig:_config];

    if (_delegate) {
      ABI47_0_0EX_WEAKIFY(self);
      dispatch_async(dispatch_get_main_queue(), ^{
        ABI47_0_0EX_ENSURE_STRONGIFY(self);
        [self->_delegate appController:self didStartWithSuccess:self.launchAssetUrl != nil];
      });
    }

    return;
  }

  if (!_config.updateUrl) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"expo-updates is enabled, but no valid URL is configured under ABI47_0_0EXUpdatesURL. If you are making a release build for the first time, make sure you have run `expo publish` at least once."
                                 userInfo:@{}];
  }
  if (!_config.scopeKey) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"expo-updates was configured with no scope key. Make sure a valid URL is configured under ABI47_0_0EXUpdatesURL."
                                 userInfo:@{}];
  }

  _isStarted = YES;

  [self purgeUpdatesLogsOlderThanOneDay];

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

  [ABI47_0_0EXUpdatesBuildData ensureBuildDataIsConsistentAsync:_database config:_config];

  [_errorRecovery startMonitoring];

  _loaderTask = [[ABI47_0_0EXUpdatesAppLoaderTask alloc] initWithConfig:_config
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

  if (window.rootViewController == nil) {
      UIViewController *rootViewController = [UIViewController new];
      window.rootViewController = rootViewController;
  }
  window.rootViewController.view = view;
  [window makeKeyAndVisible];

  [self start];
}

- (void)requestRelaunchWithCompletion:(ABI47_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  ABI47_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI47_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:_config database:_database directory:_updatesDirectory completionQueue:_controllerQueue];
  _candidateLauncher = launcher;
  [launcher launchUpdateWithSelectionPolicy:self.selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
    if (success) {
      self->_launcher = self->_candidateLauncher;
      completion(YES);
      [self->_errorRecovery startMonitoring];
      ABI47_0_0RCTReloadCommandSetBundleURL(launcher.launchAssetUrl);
      ABI47_0_0RCTTriggerReloadCommandListeners(@"Requested by JavaScript - Updates.reloadAsync()");
      [self runReaper];
    } else {
      NSLog(@"Failed to relaunch: %@", error.localizedDescription);
      completion(NO);
    }
  }];
}

- (nullable ABI47_0_0EXUpdatesUpdate *)launchedUpdate
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

# pragma mark - ABI47_0_0EXUpdatesAppLoaderTaskDelegate

- (BOOL)appLoaderTask:(ABI47_0_0EXUpdatesAppLoaderTask *)appLoaderTask didLoadCachedUpdate:(nonnull ABI47_0_0EXUpdatesUpdate *)update
{
  return YES;
}

- (void)appLoaderTask:(ABI47_0_0EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(ABI47_0_0EXUpdatesUpdate *)update
{
  [_logger info:@"ABI47_0_0EXUpdatesAppController appLoaderTask didStartLoadingUpdate"
           code:ABI47_0_0EXUpdatesErrorCodeNone
       updateId:update.loggingId
        assetId:nil];
  _remoteLoadStatus = ABI47_0_0EXUpdatesRemoteLoadStatusLoading;
}

- (void)appLoaderTask:(ABI47_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<ABI47_0_0EXUpdatesAppLauncher>)launcher isUpToDate:(BOOL)isUpToDate
{
  NSString *logMessage = [NSString stringWithFormat:@"ABI47_0_0EXUpdatesAppController appLoaderTask didFinishWithLauncher, isUpToDate=%d, remoteLoadStatus=%ld", isUpToDate, _remoteLoadStatus];
  [_logger info:logMessage];
  // if isUpToDate is false, that means a remote update is still loading in the background (this
  // method was called with a cached update because the timer ran out) so don't update the status
  if (_remoteLoadStatus == ABI47_0_0EXUpdatesRemoteLoadStatusLoading && isUpToDate) {
    _remoteLoadStatus = ABI47_0_0EXUpdatesRemoteLoadStatusIdle;
  }
  _launcher = launcher;
  if (self->_delegate) {
    [ABI47_0_0EXUpdatesUtils runBlockOnMainThread:^{
      [self->_delegate appController:self didStartWithSuccess:YES];
    }];
  }
}

- (void)appLoaderTask:(ABI47_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error
{
  NSString *logMessage = [NSString stringWithFormat:@"ABI47_0_0EXUpdatesAppController appLoaderTask didFinishWithError: %@", error.localizedDescription];
  [_logger error:logMessage
            code:ABI47_0_0EXUpdatesErrorCodeUpdateFailedToLoad];
  [self _emergencyLaunchWithFatalError:error];
}

- (void)appLoaderTask:(ABI47_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishBackgroundUpdateWithStatus:(ABI47_0_0EXUpdatesBackgroundUpdateStatus)status update:(nullable ABI47_0_0EXUpdatesUpdate *)update error:(nullable NSError *)error
{
  if (status == ABI47_0_0EXUpdatesBackgroundUpdateStatusError) {
    _remoteLoadStatus = ABI47_0_0EXUpdatesRemoteLoadStatusIdle;
    NSAssert(error != nil, @"Background update with error status must have a nonnull error object");
    [_logger error:@"ABI47_0_0EXUpdatesAppController appLoaderTask didFinishBackgroundUpdateWithStatus=Error"
              code:ABI47_0_0EXUpdatesErrorCodeNone
          updateId:update.loggingId
           assetId:nil];
    [ABI47_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI47_0_0EXUpdatesErrorEventName body:@{@"message": error.localizedDescription}];
  } else if (status == ABI47_0_0EXUpdatesBackgroundUpdateStatusUpdateAvailable) {
    _remoteLoadStatus = ABI47_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded;
    NSAssert(update != nil, @"Background update with error status must have a nonnull update object");
    [_logger info:@"ABI47_0_0EXUpdatesAppController appLoaderTask didFinishBackgroundUpdateWithStatus=NewUpdateLoaded"
             code:ABI47_0_0EXUpdatesErrorCodeNone
         updateId:update.loggingId
          assetId:nil];
    [ABI47_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI47_0_0EXUpdatesUpdateAvailableEventName body:@{@"manifest": update.manifest.rawManifestJSON}];
  } else if (status == ABI47_0_0EXUpdatesBackgroundUpdateStatusNoUpdateAvailable) {
    _remoteLoadStatus = ABI47_0_0EXUpdatesRemoteLoadStatusIdle;
    [_logger error:@"ABI47_0_0EXUpdatesAppController appLoaderTask didFinishBackgroundUpdateWithStatus=NoUpdateAvailable"
              code:ABI47_0_0EXUpdatesErrorCodeNoUpdatesAvailable
          updateId:update.loggingId
           assetId:nil];
    [ABI47_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI47_0_0EXUpdatesNoUpdateAvailableEventName body:@{}];
  }
  [_errorRecovery notifyNewRemoteLoadStatus:_remoteLoadStatus];
}

# pragma mark - ABI47_0_0EXUpdatesAppController+Internal

- (BOOL)initializeUpdatesDirectoryWithError:(NSError ** _Nullable)error
{
  _updatesDirectory = [ABI47_0_0EXUpdatesUtils initializeUpdatesDirectoryWithError:error];
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

- (void)purgeUpdatesLogsOlderThanOneDay
{
  [ABI47_0_0EXUpdatesUtils purgeUpdatesLogsOlderThanOneDay];
}

- (void)setDefaultSelectionPolicy:(ABI47_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  _defaultSelectionPolicy = selectionPolicy;
}

- (void)setLauncher:(nullable id<ABI47_0_0EXUpdatesAppLauncher>)launcher
{
  _launcher = launcher;
}

- (void)setConfigurationInternal:(ABI47_0_0EXUpdatesConfig *)configuration
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
    [ABI47_0_0EXUpdatesReaper reapUnusedUpdatesWithConfig:_config
                                        database:_database
                                       directory:_updatesDirectory
                                 selectionPolicy:self.selectionPolicy
                                  launchedUpdate:_launcher.launchedUpdate];
  }
}

# pragma mark - ABI47_0_0EXUpdatesErrorRecoveryDelegate

- (void)relaunchWithCompletion:(ABI47_0_0EXUpdatesAppLauncherCompletionBlock)completion
{
  ABI47_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI47_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:_config database:_database directory:_updatesDirectory completionQueue:_controllerQueue];
  _candidateLauncher = launcher;
  [launcher launchUpdateWithSelectionPolicy:self.selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
    if (success) {
      self->_launcher = self->_candidateLauncher;
      [self->_errorRecovery startMonitoring];
      ABI47_0_0RCTReloadCommandSetBundleURL(launcher.launchAssetUrl);
      ABI47_0_0RCTTriggerReloadCommandListeners(@"Relaunch after fatal error");
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

  _remoteLoadStatus = ABI47_0_0EXUpdatesRemoteLoadStatusLoading;
  ABI47_0_0EXUpdatesAppLoader *remoteAppLoader = [[ABI47_0_0EXUpdatesRemoteAppLoader alloc] initWithConfig:_config database:_database directory:_updatesDirectory launchedUpdate:self.launchedUpdate completionQueue:_controllerQueue];
  [remoteAppLoader loadUpdateFromUrl:_config.updateUrl onManifest:^BOOL(ABI47_0_0EXUpdatesUpdate *update) {
    return [self->_selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:self.launchedUpdate filters:update.manifestFilters];
  } asset:^(ABI47_0_0EXUpdatesAsset *asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    // do nothing for now
  } success:^(ABI47_0_0EXUpdatesUpdate * _Nullable update) {
    self->_remoteLoadStatus = update ? ABI47_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded : ABI47_0_0EXUpdatesRemoteLoadStatusIdle;
    [self->_errorRecovery notifyNewRemoteLoadStatus:self->_remoteLoadStatus];
  } error:^(NSError *error) {
    [self->_logger error:[NSString stringWithFormat:@"ABI47_0_0EXUpdatesAppController loadRemoteUpdate error: %@", error.localizedDescription]
              code:ABI47_0_0EXUpdatesErrorCodeUpdateFailedToLoad];
    self->_remoteLoadStatus = ABI47_0_0EXUpdatesRemoteLoadStatusIdle;
    [self->_errorRecovery notifyNewRemoteLoadStatus:self->_remoteLoadStatus];
  }];
}

- (void)markFailedLaunchForLaunchedUpdate
{
  if (_isEmergencyLaunch) {
    return;
  }
  dispatch_async(_database.databaseQueue, ^{
    ABI47_0_0EXUpdatesUpdate *launchedUpdate = self.launchedUpdate;
    if (!launchedUpdate) {
      return;
    }
    [self->_logger error:@"ABI47_0_0EXUpdatesAppController markFailedLaunchForUpdate"
                    code:ABI47_0_0EXUpdatesErrorCodeUnknown
                updateId:launchedUpdate.loggingId
                 assetId:nil];
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
    ABI47_0_0EXUpdatesUpdate *launchedUpdate = self.launchedUpdate;
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

  ABI47_0_0EXUpdatesAppLauncherNoDatabase *launcher = [[ABI47_0_0EXUpdatesAppLauncherNoDatabase alloc] init];
  _launcher = launcher;
  [launcher launchUpdateWithConfig:_config];

  if (_delegate) {
    ABI47_0_0EX_WEAKIFY(self);
    dispatch_async(dispatch_get_main_queue(), ^{
      ABI47_0_0EX_ENSURE_STRONGIFY(self);
      [self->_delegate appController:self didStartWithSuccess:self.launchAssetUrl != nil];
    });
  }

  [_errorRecovery writeErrorOrExceptionToLog:error];
}

@end

NS_ASSUME_NONNULL_END
