//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController+Internal.h>
#import <EXUpdates/EXUpdatesAppLauncherWithDatabase.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDevLauncherController.h>
#import <EXupdates/EXUpdatesLauncherSelectionPolicySingleUpdate.h>
#import <EXUpdates/EXUpdatesReaper.h>
#import <EXUpdates/EXUpdatesReaperSelectionPolicyDevelopmentClient.h>
#import <EXUpdates/EXUpdatesRemoteAppLoader.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>
#import <EXUpdates/EXUpdatesUpdate.h>
#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesDevLauncherControllerErrorDomain = @"EXUpdatesDevLauncherController";

typedef NS_ENUM(NSInteger, EXUpdatesDevLauncherErrorCode) {
  EXUpdatesDevLauncherErrorCodeInvalidUpdateURL = 1,
  EXUpdatesDevLauncherErrorCodeDirectoryInitializationFailed,
  EXUpdatesDevLauncherErrorCodeDatabaseInitializationFailed,
  EXUpdatesDevLauncherErrorCodeUpdateLaunchFailed,
};

@interface EXUpdatesDevLauncherController ()

@property (nonatomic, strong) EXUpdatesConfig *tempConfig;

@end

/**
 * Main entry point to expo-updates in development builds with expo-dev-client. Singleton that still
 * makes use of EXUpdatesAppController for keeping track of updates state, but provides capabilities
 * that are not usually exposed but that expo-dev-client needs (launching and downloading a specific
 * update by URL, allowing dynamic configuration, introspecting the database).
 *
 * Implements the EXUpdatesExternalInterface from the expo-updates-interface package. This allows
 * expo-dev-client to compile without needing expo-updates to be installed.
 */
@implementation EXUpdatesDevLauncherController

@synthesize bridge = _bridge;

+ (instancetype)sharedInstance
{
  static EXUpdatesDevLauncherController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [EXUpdatesDevLauncherController new];
    }
  });
  return theController;
}

- (void)setBridge:(nullable id)bridge
{
  _bridge = bridge;
  if ([bridge isKindOfClass:[RCTBridge class]]) {
    EXUpdatesAppController.sharedInstance.bridge = (RCTBridge *)bridge;
  }
}

- (void)reset
{
  EXUpdatesAppController *controller = EXUpdatesAppController.sharedInstance;
  [controller setLauncher:nil];
  [controller setIsStarted:NO];
}

- (NSURL *)launchAssetURL
{
  return EXUpdatesAppController.sharedInstance.launchAssetUrl;
}

- (void)fetchUpdateWithConfiguration:(NSDictionary *)configuration
                          onManifest:(EXUpdatesManifestBlock)manifestBlock
                            progress:(EXUpdatesProgressBlock)progressBlock
                             success:(EXUpdatesUpdateSuccessBlock)successBlock
                               error:(EXUpdatesErrorBlock)errorBlock
{
  EXUpdatesConfig *updatesConfiguration = [self _setup:configuration
                                                 error:errorBlock];
  if (updatesConfiguration == nil) {
    return;
  }

  EXUpdatesAppController *controller = EXUpdatesAppController.sharedInstance;

  // since controller is a singleton, save its config so we can reset to it if our request fails
  _tempConfig = controller.config;

  [self _setDevelopmentSelectionPolicy];
  [controller setConfigurationInternal:updatesConfiguration];

  EXUpdatesRemoteAppLoader *loader = [[EXUpdatesRemoteAppLoader alloc] initWithConfig:updatesConfiguration database:controller.database directory:controller.updatesDirectory launchedUpdate:nil completionQueue:controller.controllerQueue];

  [loader loadUpdateFromUrl:updatesConfiguration.updateUrl onManifest:^BOOL(EXUpdatesUpdate * _Nonnull update) {
    return manifestBlock(update.manifest.rawManifestJSON);
  } asset:^(EXUpdatesAsset * _Nonnull asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    progressBlock(successfulAssetCount, failedAssetCount, totalAssetCount);
  } success:^(EXUpdatesUpdate * _Nullable update) {
    if (!update) {
      successBlock(nil);
      return;
    }
    [self _launchUpdate:update withConfiguration:updatesConfiguration success:successBlock error:errorBlock];
  } error:^(NSError * _Nonnull error) {
    // reset controller's configuration to what it was before this request
    [controller setConfigurationInternal:self->_tempConfig];
    errorBlock(error);
  }];
}

- (void)storedUpdateIdsWithConfiguration:(NSDictionary *)configuration
                                 success:(EXUpdatesQuerySuccessBlock)successBlock
                                   error:(EXUpdatesErrorBlock)errorBlock
{
  EXUpdatesConfig *updatesConfiguration = [self _setup:configuration
                                                 error:errorBlock];
  if (updatesConfiguration == nil) {
    successBlock(@[]);
  }

  [EXUpdatesAppLauncherWithDatabase storedUpdateIdsInDatabase:EXUpdatesAppController.sharedInstance.database completion:^(NSError * _Nullable error, NSArray<NSUUID *> * _Nonnull storedUpdateIds) {
    if (error != nil) {
      errorBlock(error);
    } else {
      successBlock(storedUpdateIds);
    }
  }];
}

// Common initialization for both fetchUpdateWithConfiguration: and storedUpdateIdsWithConfiguration:
// Sets up EXUpdatesAppController shared instance
// Returns the updatesConfiguration
- (nullable EXUpdatesConfig *)_setup:(nonnull NSDictionary *)configuration
                               error:(EXUpdatesErrorBlock)errorBlock
{
  EXUpdatesAppController *controller = EXUpdatesAppController.sharedInstance;
  EXUpdatesConfig *updatesConfiguration = [EXUpdatesConfig configWithExpoPlist];
  [updatesConfiguration loadConfigFromDictionary:configuration];
  if (!updatesConfiguration.updateUrl || !updatesConfiguration.scopeKey) {
    errorBlock([NSError errorWithDomain:EXUpdatesDevLauncherControllerErrorDomain code:EXUpdatesDevLauncherErrorCodeInvalidUpdateURL userInfo:@{NSLocalizedDescriptionKey: @"Failed to read stored updates: configuration object must include a valid update URL"}]);
    return nil;
  }
  NSError *fsError;
  if (![controller initializeUpdatesDirectoryWithError:&fsError]) {
    errorBlock(fsError ?: [NSError errorWithDomain:EXUpdatesDevLauncherControllerErrorDomain code:EXUpdatesDevLauncherErrorCodeDirectoryInitializationFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize updates directory with an unknown error"}]);
    return nil;
  }
  NSError *dbError;
  if (![controller initializeUpdatesDatabaseWithError:&dbError]) {
    errorBlock(dbError ?: [NSError errorWithDomain:EXUpdatesDevLauncherControllerErrorDomain code:EXUpdatesDevLauncherErrorCodeDatabaseInitializationFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize updates database with an unknown error"}]);
    return nil;
  }

  return updatesConfiguration;
}

- (void)_setDevelopmentSelectionPolicy
{
  EXUpdatesAppController *controller = EXUpdatesAppController.sharedInstance;
  [controller resetSelectionPolicyToDefault];
  EXUpdatesSelectionPolicy *currentSelectionPolicy = controller.selectionPolicy;
  [controller setDefaultSelectionPolicy:[[EXUpdatesSelectionPolicy alloc]
                                         initWithLauncherSelectionPolicy:currentSelectionPolicy.launcherSelectionPolicy
                                         loaderSelectionPolicy:currentSelectionPolicy.loaderSelectionPolicy
                                         reaperSelectionPolicy:[EXUpdatesReaperSelectionPolicyDevelopmentClient new]]];
  [controller resetSelectionPolicyToDefault];
}

- (void)_launchUpdate:(EXUpdatesUpdate *)update
    withConfiguration:(EXUpdatesConfig *)configuration
              success:(EXUpdatesUpdateSuccessBlock)successBlock
                error:(EXUpdatesErrorBlock)errorBlock
{
  EXUpdatesAppController *controller = EXUpdatesAppController.sharedInstance;

  // ensure that we launch the update we want, even if it isn't the latest one
  EXUpdatesSelectionPolicy *currentSelectionPolicy = controller.selectionPolicy;
  // Calling `setNextSelectionPolicy` allows the Updates module's `reloadAsync` method to reload
  // with a different (newer) update if one is downloaded, e.g. using `fetchUpdateAsync`. If we set
  // the default selection policy here instead, the update we are launching here would keep being
  // launched by `reloadAsync` even if a newer one is downloaded.
  [controller setNextSelectionPolicy:[[EXUpdatesSelectionPolicy alloc]
                                      initWithLauncherSelectionPolicy:[[EXUpdatesLauncherSelectionPolicySingleUpdate alloc] initWithUpdateID:update.updateId]
                                      loaderSelectionPolicy:currentSelectionPolicy.loaderSelectionPolicy
                                      reaperSelectionPolicy:currentSelectionPolicy.reaperSelectionPolicy]];

  EXUpdatesAppLauncherWithDatabase *launcher = [[EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:configuration database:controller.database directory:controller.updatesDirectory completionQueue:controller.controllerQueue];
  [launcher launchUpdateWithSelectionPolicy:controller.selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
    if (!success) {
      // reset controller's configuration to what it was before this request
      [controller setConfigurationInternal:self->_tempConfig];
      errorBlock(error ?: [NSError errorWithDomain:EXUpdatesDevLauncherControllerErrorDomain code:EXUpdatesDevLauncherErrorCodeUpdateLaunchFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to launch update with an unknown error"}]);
      return;
    }

    [controller setIsStarted:YES];
    [controller setLauncher:launcher];
    successBlock(launcher.launchedUpdate.manifest.rawManifestJSON);
    [controller runReaper];
  }];
}

@end

NS_ASSUME_NONNULL_END
