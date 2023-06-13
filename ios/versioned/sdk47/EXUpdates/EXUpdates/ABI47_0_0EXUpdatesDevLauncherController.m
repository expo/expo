//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAppController+Internal.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAppLauncherWithDatabase.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesConfig.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesDevLauncherController.h>
#import <ABI47_0_0EXupdates/ABI47_0_0EXUpdatesLauncherSelectionPolicySingleUpdate.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesReaper.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesSelectionPolicy.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesUpdate.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI47_0_0EXUpdatesDevLauncherControllerErrorDomain = @"ABI47_0_0EXUpdatesDevLauncherController";

typedef NS_ENUM(NSInteger, ABI47_0_0EXUpdatesDevLauncherErrorCode) {
  ABI47_0_0EXUpdatesDevLauncherErrorCodeInvalidUpdateURL = 1,
  ABI47_0_0EXUpdatesDevLauncherErrorCodeDirectoryInitializationFailed,
  ABI47_0_0EXUpdatesDevLauncherErrorCodeDatabaseInitializationFailed,
  ABI47_0_0EXUpdatesDevLauncherErrorCodeUpdateLaunchFailed,
};

@interface ABI47_0_0EXUpdatesDevLauncherController ()

@property (nonatomic, strong) ABI47_0_0EXUpdatesConfig *tempConfig;

@end

/**
 * Main entry point to expo-updates in development builds with expo-dev-client. Singleton that still
 * makes use of ABI47_0_0EXUpdatesAppController for keeping track of updates state, but provides capabilities
 * that are not usually exposed but that expo-dev-client needs (launching and downloading a specific
 * update by URL, allowing dynamic configuration, introspecting the database).
 *
 * Implements the ABI47_0_0EXUpdatesExternalInterface from the expo-updates-interface package. This allows
 * expo-dev-client to compile without needing expo-updates to be installed.
 */
@implementation ABI47_0_0EXUpdatesDevLauncherController

@synthesize bridge = _bridge;

+ (instancetype)sharedInstance
{
  static ABI47_0_0EXUpdatesDevLauncherController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [ABI47_0_0EXUpdatesDevLauncherController new];
    }
  });
  return theController;
}

- (void)setBridge:(nullable id)bridge
{
  _bridge = bridge;
  if ([bridge isKindOfClass:[ABI47_0_0RCTBridge class]]) {
    ABI47_0_0EXUpdatesAppController.sharedInstance.bridge = (ABI47_0_0RCTBridge *)bridge;
  }
}

- (void)reset
{
  ABI47_0_0EXUpdatesAppController *controller = ABI47_0_0EXUpdatesAppController.sharedInstance;
  [controller setLauncher:nil];
  [controller setIsStarted:NO];
}

- (NSURL *)launchAssetURL
{
  return ABI47_0_0EXUpdatesAppController.sharedInstance.launchAssetUrl;
}

- (void)fetchUpdateWithConfiguration:(NSDictionary *)configuration
                          onManifest:(ABI47_0_0EXUpdatesManifestBlock)manifestBlock
                            progress:(ABI47_0_0EXUpdatesProgressBlock)progressBlock
                             success:(ABI47_0_0EXUpdatesUpdateSuccessBlock)successBlock
                               error:(ABI47_0_0EXUpdatesErrorBlock)errorBlock
{
  ABI47_0_0EXUpdatesConfig *updatesConfiguration = [self _setup:configuration
                                                 error:errorBlock];
  if (updatesConfiguration == nil) {
    return;
  }

  ABI47_0_0EXUpdatesAppController *controller = ABI47_0_0EXUpdatesAppController.sharedInstance;

  // since controller is a singleton, save its config so we can reset to it if our request fails
  _tempConfig = controller.config;

  [self _setDevelopmentSelectionPolicy];
  [controller setConfigurationInternal:updatesConfiguration];

  ABI47_0_0EXUpdatesRemoteAppLoader *loader = [[ABI47_0_0EXUpdatesRemoteAppLoader alloc] initWithConfig:updatesConfiguration database:controller.database directory:controller.updatesDirectory launchedUpdate:nil completionQueue:controller.controllerQueue];

  [loader loadUpdateFromUrl:updatesConfiguration.updateUrl onManifest:^BOOL(ABI47_0_0EXUpdatesUpdate * _Nonnull update) {
    return manifestBlock(update.manifest.rawManifestJSON);
  } asset:^(ABI47_0_0EXUpdatesAsset * _Nonnull asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    progressBlock(successfulAssetCount, failedAssetCount, totalAssetCount);
  } success:^(ABI47_0_0EXUpdatesUpdate * _Nullable update) {
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
                                 success:(ABI47_0_0EXUpdatesQuerySuccessBlock)successBlock
                                   error:(ABI47_0_0EXUpdatesErrorBlock)errorBlock
{
  ABI47_0_0EXUpdatesConfig *updatesConfiguration = [self _setup:configuration
                                                 error:errorBlock];
  if (updatesConfiguration == nil) {
    successBlock(@[]);
  }

  [ABI47_0_0EXUpdatesAppLauncherWithDatabase storedUpdateIdsInDatabase:ABI47_0_0EXUpdatesAppController.sharedInstance.database completion:^(NSError * _Nullable error, NSArray<NSUUID *> * _Nonnull storedUpdateIds) {
    if (error != nil) {
      errorBlock(error);
    } else {
      successBlock(storedUpdateIds);
    }
  }];
}

// Common initialization for both fetchUpdateWithConfiguration: and storedUpdateIdsWithConfiguration:
// Sets up ABI47_0_0EXUpdatesAppController shared instance
// Returns the updatesConfiguration
- (nullable ABI47_0_0EXUpdatesConfig *)_setup:(nonnull NSDictionary *)configuration
                               error:(ABI47_0_0EXUpdatesErrorBlock)errorBlock
{
  ABI47_0_0EXUpdatesAppController *controller = ABI47_0_0EXUpdatesAppController.sharedInstance;
  ABI47_0_0EXUpdatesConfig *updatesConfiguration = [ABI47_0_0EXUpdatesConfig configWithExpoPlist];
  [updatesConfiguration loadConfigFromDictionary:configuration];
  if (!updatesConfiguration.updateUrl || !updatesConfiguration.scopeKey) {
    errorBlock([NSError errorWithDomain:ABI47_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI47_0_0EXUpdatesDevLauncherErrorCodeInvalidUpdateURL userInfo:@{NSLocalizedDescriptionKey: @"Failed to read stored updates: configuration object must include a valid update URL"}]);
    return nil;
  }
  NSError *fsError;
  if (![controller initializeUpdatesDirectoryWithError:&fsError]) {
    errorBlock(fsError ?: [NSError errorWithDomain:ABI47_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI47_0_0EXUpdatesDevLauncherErrorCodeDirectoryInitializationFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize updates directory with an unknown error"}]);
    return nil;
  }
  NSError *dbError;
  if (![controller initializeUpdatesDatabaseWithError:&dbError]) {
    errorBlock(dbError ?: [NSError errorWithDomain:ABI47_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI47_0_0EXUpdatesDevLauncherErrorCodeDatabaseInitializationFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize updates database with an unknown error"}]);
    return nil;
  }

  return updatesConfiguration;
}

- (void)_setDevelopmentSelectionPolicy
{
  ABI47_0_0EXUpdatesAppController *controller = ABI47_0_0EXUpdatesAppController.sharedInstance;
  [controller resetSelectionPolicyToDefault];
  ABI47_0_0EXUpdatesSelectionPolicy *currentSelectionPolicy = controller.selectionPolicy;
  [controller setDefaultSelectionPolicy:[[ABI47_0_0EXUpdatesSelectionPolicy alloc]
                                         initWithLauncherSelectionPolicy:currentSelectionPolicy.launcherSelectionPolicy
                                         loaderSelectionPolicy:currentSelectionPolicy.loaderSelectionPolicy
                                         reaperSelectionPolicy:[ABI47_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient new]]];
  [controller resetSelectionPolicyToDefault];
}

- (void)_launchUpdate:(ABI47_0_0EXUpdatesUpdate *)update
    withConfiguration:(ABI47_0_0EXUpdatesConfig *)configuration
              success:(ABI47_0_0EXUpdatesUpdateSuccessBlock)successBlock
                error:(ABI47_0_0EXUpdatesErrorBlock)errorBlock
{
  ABI47_0_0EXUpdatesAppController *controller = ABI47_0_0EXUpdatesAppController.sharedInstance;

  // ensure that we launch the update we want, even if it isn't the latest one
  ABI47_0_0EXUpdatesSelectionPolicy *currentSelectionPolicy = controller.selectionPolicy;
  // Calling `setNextSelectionPolicy` allows the Updates module's `reloadAsync` method to reload
  // with a different (newer) update if one is downloaded, e.g. using `fetchUpdateAsync`. If we set
  // the default selection policy here instead, the update we are launching here would keep being
  // launched by `reloadAsync` even if a newer one is downloaded.
  [controller setNextSelectionPolicy:[[ABI47_0_0EXUpdatesSelectionPolicy alloc]
                                      initWithLauncherSelectionPolicy:[[ABI47_0_0EXUpdatesLauncherSelectionPolicySingleUpdate alloc] initWithUpdateID:update.updateId]
                                      loaderSelectionPolicy:currentSelectionPolicy.loaderSelectionPolicy
                                      reaperSelectionPolicy:currentSelectionPolicy.reaperSelectionPolicy]];

  ABI47_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI47_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:configuration database:controller.database directory:controller.updatesDirectory completionQueue:controller.controllerQueue];
  [launcher launchUpdateWithSelectionPolicy:controller.selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
    if (!success) {
      // reset controller's configuration to what it was before this request
      [controller setConfigurationInternal:self->_tempConfig];
      errorBlock(error ?: [NSError errorWithDomain:ABI47_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI47_0_0EXUpdatesDevLauncherErrorCodeUpdateLaunchFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to launch update with an unknown error"}]);
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
