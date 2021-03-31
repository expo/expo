//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesAppController.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesAppLauncher.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesAppLauncherNoDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesAppLauncherWithDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesReaper.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesSelectionPolicyFilterAware.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI41_0_0EXUpdatesAppControllerErrorDomain = @"ABI41_0_0EXUpdatesAppController";

static NSString * const ABI41_0_0EXUpdatesConfigPlistName = @"Expo";

static NSString * const ABI41_0_0EXUpdatesUpdateAvailableEventName = @"updateAvailable";
static NSString * const ABI41_0_0EXUpdatesNoUpdateAvailableEventName = @"noUpdateAvailable";
static NSString * const ABI41_0_0EXUpdatesErrorEventName = @"error";

@interface ABI41_0_0EXUpdatesAppController ()

@property (nonatomic, readwrite, strong) ABI41_0_0EXUpdatesConfig *config;
@property (nonatomic, readwrite, strong) id<ABI41_0_0EXUpdatesAppLauncher> launcher;
@property (nonatomic, readwrite, strong) ABI41_0_0EXUpdatesDatabase *database;
@property (nonatomic, readwrite, strong) id<ABI41_0_0EXUpdatesSelectionPolicy> selectionPolicy;
@property (nonatomic, readwrite, strong) dispatch_queue_t assetFilesQueue;

@property (nonatomic, readwrite, strong) NSURL *updatesDirectory;

@property (nonatomic, strong) id<ABI41_0_0EXUpdatesAppLauncher> candidateLauncher;
@property (nonatomic, assign) BOOL hasLaunched;
@property (nonatomic, strong) dispatch_queue_t controllerQueue;

@property (nonatomic, assign) BOOL isStarted;
@property (nonatomic, assign) BOOL isEmergencyLaunch;

@end

@implementation ABI41_0_0EXUpdatesAppController

+ (instancetype)sharedInstance
{
  static ABI41_0_0EXUpdatesAppController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [[ABI41_0_0EXUpdatesAppController alloc] init];
    }
  });
  return theController;
}

- (instancetype)init
{
  if (self = [super init]) {
    _config = [self _loadConfigFromExpoPlist];
    _database = [[ABI41_0_0EXUpdatesDatabase alloc] init];
    _selectionPolicy = [[ABI41_0_0EXUpdatesSelectionPolicyFilterAware alloc] initWithRuntimeVersion:[ABI41_0_0EXUpdatesUtils getRuntimeVersionWithConfig:_config]];
    _assetFilesQueue = dispatch_queue_create("expo.controller.AssetFilesQueue", DISPATCH_QUEUE_SERIAL);
    _controllerQueue = dispatch_queue_create("expo.controller.ControllerQueue", DISPATCH_QUEUE_SERIAL);
    _isStarted = NO;
  }
  return self;
}

- (void)setConfiguration:(NSDictionary *)configuration
{
  if (_updatesDirectory) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"ABI41_0_0EXUpdatesAppController:setConfiguration should not be called after start"
                                 userInfo:@{}];
  }
  [_config loadConfigFromDictionary:configuration];
  _selectionPolicy = [[ABI41_0_0EXUpdatesSelectionPolicyFilterAware alloc] initWithRuntimeVersion:[ABI41_0_0EXUpdatesUtils getRuntimeVersionWithConfig:_config]];
}

- (void)start
{
  NSAssert(!_updatesDirectory, @"ABI41_0_0EXUpdatesAppController:start should only be called once per instance");

  if (!_config.isEnabled) {
    ABI41_0_0EXUpdatesAppLauncherNoDatabase *launcher = [[ABI41_0_0EXUpdatesAppLauncherNoDatabase alloc] init];
    _launcher = launcher;
    [launcher launchUpdateWithConfig:_config];

    if (_delegate) {
      [_delegate appController:self didStartWithSuccess:self.launchAssetUrl != nil];
    }

    return;
  }

  if (!_config.updateUrl) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"expo-updates is enabled, but no valid URL is configured under ABI41_0_0EXUpdatesURL. If you are making a release build for the first time, make sure you have run `expo publish` at least once."
                                 userInfo:@{}];
  }

  _isStarted = YES;

  NSError *fsError;
  _updatesDirectory = [ABI41_0_0EXUpdatesUtils initializeUpdatesDirectoryWithError:&fsError];
  if (fsError) {
    [self _emergencyLaunchWithFatalError:fsError];
    return;
  }

  __block BOOL dbSuccess;
  __block NSError *dbError;
  dispatch_semaphore_t dbSemaphore = dispatch_semaphore_create(0);
  dispatch_async(_database.databaseQueue, ^{
    dbSuccess = [self->_database openDatabaseInDirectory:self->_updatesDirectory withError:&dbError];
    dispatch_semaphore_signal(dbSemaphore);
  });

  dispatch_semaphore_wait(dbSemaphore, DISPATCH_TIME_FOREVER);
  if (!dbSuccess) {
    [self _emergencyLaunchWithFatalError:dbError];
    return;
  }

  ABI41_0_0EXUpdatesAppLoaderTask *loaderTask = [[ABI41_0_0EXUpdatesAppLoaderTask alloc] initWithConfig:_config
                                                                             database:_database
                                                                            directory:_updatesDirectory
                                                                      selectionPolicy:_selectionPolicy
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

- (void)requestRelaunchWithCompletion:(ABI41_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  if (_bridge) {
    ABI41_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI41_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:_config database:_database directory:_updatesDirectory completionQueue:_controllerQueue];
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
    NSLog(@"ABI41_0_0EXUpdatesAppController: Failed to reload because bridge was nil. Did you set the bridge property on the controller singleton?");
    completion(NO);
  }
}

- (nullable ABI41_0_0EXUpdatesUpdate *)launchedUpdate
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

# pragma mark - ABI41_0_0EXUpdatesAppLoaderTaskDelegate

- (BOOL)appLoaderTask:(ABI41_0_0EXUpdatesAppLoaderTask *)appLoaderTask didLoadCachedUpdate:(nonnull ABI41_0_0EXUpdatesUpdate *)update
{
  return YES;
}

- (void)appLoaderTask:(ABI41_0_0EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(ABI41_0_0EXUpdatesUpdate *)update
{
  // do nothing here for now
}

- (void)appLoaderTask:(ABI41_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<ABI41_0_0EXUpdatesAppLauncher>)launcher isUpToDate:(BOOL)isUpToDate
{
  _launcher = launcher;
  if (self->_delegate) {
    [ABI41_0_0EXUpdatesUtils runBlockOnMainThread:^{
      [self->_delegate appController:self didStartWithSuccess:YES];
    }];
  }
}

- (void)appLoaderTask:(ABI41_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error
{
  [self _emergencyLaunchWithFatalError:error];
}

- (void)appLoaderTask:(ABI41_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishBackgroundUpdateWithStatus:(ABI41_0_0EXUpdatesBackgroundUpdateStatus)status update:(nullable ABI41_0_0EXUpdatesUpdate *)update error:(nullable NSError *)error
{
  if (status == ABI41_0_0EXUpdatesBackgroundUpdateStatusError) {
    NSAssert(error != nil, @"Background update with error status must have a nonnull error object");
    [ABI41_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI41_0_0EXUpdatesErrorEventName body:@{@"message": error.localizedDescription}];
  } else if (status == ABI41_0_0EXUpdatesBackgroundUpdateStatusUpdateAvailable) {
    NSAssert(update != nil, @"Background update with error status must have a nonnull update object");
    [ABI41_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI41_0_0EXUpdatesUpdateAvailableEventName body:@{@"manifest": update.rawManifest}];
  } else if (status == ABI41_0_0EXUpdatesBackgroundUpdateStatusNoUpdateAvailable) {
    [ABI41_0_0EXUpdatesUtils sendEventToBridge:_bridge withType:ABI41_0_0EXUpdatesNoUpdateAvailableEventName body:@{}];
  }
}

# pragma mark - internal

- (ABI41_0_0EXUpdatesConfig *)_loadConfigFromExpoPlist
{
  NSString *configPath = [[NSBundle mainBundle] pathForResource:ABI41_0_0EXUpdatesConfigPlistName ofType:@"plist"];
  if (!configPath) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Cannot load configuration from Expo.plist. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
                                 userInfo:@{}];
  }

  return [ABI41_0_0EXUpdatesConfig configWithDictionary:[NSDictionary dictionaryWithContentsOfFile:configPath]];
}

- (void)_runReaper
{
  if (_launcher.launchedUpdate) {
    [ABI41_0_0EXUpdatesReaper reapUnusedUpdatesWithConfig:_config
                                        database:_database
                                       directory:_updatesDirectory
                                 selectionPolicy:_selectionPolicy
                                  launchedUpdate:_launcher.launchedUpdate];
  }
}

- (void)_emergencyLaunchWithFatalError:(NSError *)error
{
  _isEmergencyLaunch = YES;

  ABI41_0_0EXUpdatesAppLauncherNoDatabase *launcher = [[ABI41_0_0EXUpdatesAppLauncherNoDatabase alloc] init];
  _launcher = launcher;
  [launcher launchUpdateWithConfig:_config fatalError:error];

  if (_delegate) {
    [ABI41_0_0EXUpdatesUtils runBlockOnMainThread:^{
      [self->_delegate appController:self didStartWithSuccess:self.launchAssetUrl != nil];
    }];
  }
}

@end

NS_ASSUME_NONNULL_END
