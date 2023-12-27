//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppController+Internal.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppLauncher.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppLauncherNoDatabase.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppLauncherWithDatabase.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesReaper.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesSelectionPolicyFactory.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesUtils.h>
#import <ABI43_0_0React/ABI43_0_0RCTReloadCommand.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI43_0_0EXUpdatesAppControllerErrorDomain = @"ABI43_0_0EXUpdatesAppController";

static NSString * const ABI43_0_0EXUpdatesUpdateAvailableEventName = @"updateAvailable";
static NSString * const ABI43_0_0EXUpdatesNoUpdateAvailableEventName = @"noUpdateAvailable";
static NSString * const ABI43_0_0EXUpdatesErrorEventName = @"error";

@interface ABI43_0_0EXUpdatesAppController ()

@property (nonatomic, readwrite, strong) ABI43_0_0EXUpdatesConfig *config;
@property (nonatomic, readwrite, strong, nullable) id<ABI43_0_0EXUpdatesAppLauncher> launcher;
@property (nonatomic, readwrite, strong) ABI43_0_0EXUpdatesDatabase *database;
@property (nonatomic, readwrite, strong) ABI43_0_0EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readwrite, strong) ABI43_0_0EXUpdatesSelectionPolicy *defaultSelectionPolicy;
@property (nonatomic, readwrite, strong) dispatch_queue_t controllerQueue;
@property (nonatomic, readwrite, strong) dispatch_queue_t assetFilesQueue;

@property (nonatomic, readwrite, strong) NSURL *updatesDirectory;

@property (nonatomic, strong) id<ABI43_0_0EXUpdatesAppLauncher> candidateLauncher;
@property (nonatomic, assign) BOOL hasLaunched;

@property (nonatomic, assign) BOOL isStarted;
@property (nonatomic, assign) BOOL isEmergencyLaunch;

@end

@implementation ABI43_0_0EXUpdatesAppController

+ (instancetype)sharedInstance
{
  static ABI43_0_0EXUpdatesAppController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [[ABI43_0_0EXUpdatesAppController alloc] init];
    }
  });
  return theController;
}

- (instancetype)init
{
  if (self = [super init]) {
    _config = [ABI43_0_0EXUpdatesConfig configWithExpoPlist];
    _database = [[ABI43_0_0EXUpdatesDatabase alloc] init];
    _defaultSelectionPolicy = [ABI43_0_0EXUpdatesSelectionPolicyFactory filterAwarePolicyWithRuntimeVersion:[ABI43_0_0EXUpdatesUtils getRuntimeVersionWithConfig:_config]];
    _assetFilesQueue = dispatch_queue_create("expo.controller.AssetFilesQueue", DISPATCH_QUEUE_SERIAL);
    _controllerQueue = dispatch_queue_create("expo.controller.ControllerQueue", DISPATCH_QUEUE_SERIAL);
    _isStarted = NO;
  }
  return self;
}

- (void)setConfiguration:(NSDictionary *)configuration
{
  if (_isStarted) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"ABI43_0_0EXUpdatesAppController:setConfiguration should not be called after start"
                                 userInfo:@{}];
  }
  [_config loadConfigFromDictionary:configuration];
  [self resetSelectionPolicyToDefault];
}

- (ABI43_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  if (!_selectionPolicy) {
    _selectionPolicy = _defaultSelectionPolicy;
  }
  return _selectionPolicy;
}

- (void)setNextSelectionPolicy:(ABI43_0_0EXUpdatesSelectionPolicy *)nextSelectionPolicy
{
  _selectionPolicy = nextSelectionPolicy;
}

- (void)resetSelectionPolicyToDefault
{
  _selectionPolicy = nil;
}

- (void)start
{
  NSAssert(!_isStarted, @"ABI43_0_0EXUpdatesAppController:start should only be called once per instance");

  if (!_config.isEnabled) {
    ABI43_0_0EXUpdatesAppLauncherNoDatabase *launcher = [[ABI43_0_0EXUpdatesAppLauncherNoDatabase alloc] init];
    _launcher = launcher;
    [launcher launchUpdateWithConfig:_config];

    if (_delegate) {
      [_delegate appController:self didStartWithSuccess:self.launchAssetUrl != nil];
    }

    return;
  }

  if (!_config.updateUrl) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"expo-updates is enabled, but no valid URL is configured under ABI43_0_0EXUpdatesURL. If you are making a release build for the first time, make sure you have run `expo publish` at least once."
                                 userInfo:@{}];
  }
  if (!_config.scopeKey) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"expo-updates was configured with no scope key. Make sure a valid URL is configured under ABI43_0_0EXUpdatesURL."
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

  ABI43_0_0EXUpdatesAppLoaderTask *loaderTask = [[ABI43_0_0EXUpdatesAppLoaderTask alloc] initWithConfig:_config
                                                                             database:_database
                                                                            directory:_updatesDirectory
                                                                      selectionPolicy:self.selectionPolicy
                                                                        delegateQueue:_controllerQueue];
  loaderTask.delegate = self;
  [loaderTask start];
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
  } else if ([mainBundle pathForResource:launchScreen ofType:@"storyboard"] != nil ||
             [mainBundle pathForResource:launchScreen ofType:@"storyboardc"] != nil) {
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

- (void)requestRelaunchWithCompletion:(ABI43_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  ABI43_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI43_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:_config database:_database directory:_updatesDirectory completionQueue:_controllerQueue];
  _candidateLauncher = launcher;
  [launcher launchUpdateWithSelectionPolicy:self.selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
    if (success) {
      self->_launcher = self->_candidateLauncher;
      completion(YES);
      ABI43_0_0RCTReloadCommandSetBundleURL(launcher.launchAssetUrl);
      ABI43_0_0RCTTriggerReloadCommandListeners(@"Requested by JavaScript - Updates.reloadAsync()");
      [self runReaper];
    } else {
      NSLog(@"Failed to relaunch: %@", error.localizedDescription);
      completion(NO);
    }
  }];
}

- (nullable ABI43_0_0EXUpdatesUpdate *)launchedUpdate
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

# pragma mark - ABI43_0_0EXUpdatesAppLoaderTaskDelegate

- (BOOL)appLoaderTask:(ABI43_0_0EXUpdatesAppLoaderTask *)appLoaderTask didLoadCachedUpdate:(nonnull ABI43_0_0EXUpdatesUpdate *)update
{
  return YES;
}

- (void)appLoaderTask:(ABI43_0_0EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(ABI43_0_0EXUpdatesUpdate *)update
{
  // do nothing here for now
}

- (void)appLoaderTask:(ABI43_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<ABI43_0_0EXUpdatesAppLauncher>)launcher isUpToDate:(BOOL)isUpToDate
{
  _launcher = launcher;
  if (self->_delegate) {
    [ABI43_0_0EXUpdatesUtils runBlockOnMainThread:^{
      [self->_delegate appController:self didStartWithSuccess:YES];
    }];
  }
}

- (void)appLoaderTask:(ABI43_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error
{
  [self _emergencyLaunchWithFatalError:error];
}

- (void)appLoaderTask:(ABI43_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishBackgroundUpdateWithStatus:(ABI43_0_0EXUpdatesBackgroundUpdateStatus)status update:(nullable ABI43_0_0EXUpdatesUpdate *)update error:(nullable NSError *)error
{
  if (status == ABI43_0_0EXUpdatesBackgroundUpdateStatusError) {
    NSAssert(error != nil, @"Background update with error status must have a nonnull error object");
    [ABI43_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI43_0_0EXUpdatesErrorEventName body:@{@"message": error.localizedDescription}];
  } else if (status == ABI43_0_0EXUpdatesBackgroundUpdateStatusUpdateAvailable) {
    NSAssert(update != nil, @"Background update with error status must have a nonnull update object");
    [ABI43_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI43_0_0EXUpdatesUpdateAvailableEventName body:@{@"manifest": update.manifest.rawManifestJSON}];
  } else if (status == ABI43_0_0EXUpdatesBackgroundUpdateStatusNoUpdateAvailable) {
    [ABI43_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI43_0_0EXUpdatesNoUpdateAvailableEventName body:@{}];
  }
}

# pragma mark - ABI43_0_0EXUpdatesAppController+Internal

- (BOOL)initializeUpdatesDirectoryWithError:(NSError ** _Nullable)error
{
  _updatesDirectory = [ABI43_0_0EXUpdatesUtils initializeUpdatesDirectoryWithError:error];
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

- (void)setDefaultSelectionPolicy:(ABI43_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  _defaultSelectionPolicy = selectionPolicy;
}

- (void)setLauncher:(nullable id<ABI43_0_0EXUpdatesAppLauncher>)launcher
{
  _launcher = launcher;
}

- (void)setConfigurationInternal:(ABI43_0_0EXUpdatesConfig *)configuration
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
    [ABI43_0_0EXUpdatesReaper reapUnusedUpdatesWithConfig:_config
                                        database:_database
                                       directory:_updatesDirectory
                                 selectionPolicy:self.selectionPolicy
                                  launchedUpdate:_launcher.launchedUpdate];
  }
}

# pragma mark - internal

- (void)_emergencyLaunchWithFatalError:(NSError *)error
{
  _isEmergencyLaunch = YES;

  ABI43_0_0EXUpdatesAppLauncherNoDatabase *launcher = [[ABI43_0_0EXUpdatesAppLauncherNoDatabase alloc] init];
  _launcher = launcher;
  [launcher launchUpdateWithConfig:_config fatalError:error];

  if (_delegate) {
    [ABI43_0_0EXUpdatesUtils runBlockOnMainThread:^{
      [self->_delegate appController:self didStartWithSuccess:self.launchAssetUrl != nil];
    }];
  }
}

@end

NS_ASSUME_NONNULL_END
