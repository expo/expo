//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesAppController+Internal.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesAppLauncherWithDatabase.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesDevLauncherController.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesReaper.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesSelectionPolicy.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate.h>
#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI39_0_0EXUpdatesDevLauncherControllerErrorDomain = @"ABI39_0_0EXUpdatesDevLauncherController";

typedef NS_ENUM(NSInteger, ABI39_0_0EXUpdatesDevLauncherErrorCode) {
  ABI39_0_0EXUpdatesDevLauncherErrorCodeInvalidUpdateURL = 1,
  ABI39_0_0EXUpdatesDevLauncherErrorCodeDirectoryInitializationFailed,
  ABI39_0_0EXUpdatesDevLauncherErrorCodeDatabaseInitializationFailed,
  ABI39_0_0EXUpdatesDevLauncherErrorCodeUpdateLaunchFailed,
};

@implementation ABI39_0_0EXUpdatesDevLauncherController

@synthesize bridge = _bridge;

+ (instancetype)sharedInstance
{
  static ABI39_0_0EXUpdatesDevLauncherController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [ABI39_0_0EXUpdatesDevLauncherController new];
    }
  });
  return theController;
}

- (void)setBridge:(nullable id)bridge
{
  _bridge = bridge;
  if ([bridge isKindOfClass:[ABI39_0_0RCTBridge class]]) {
    ABI39_0_0EXUpdatesAppController.sharedInstance.bridge = (ABI39_0_0RCTBridge *)bridge;
  }
}

- (NSURL *)launchAssetURL
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.launchAssetUrl;
}

- (void)fetchUpdateWithConfiguration:(NSDictionary *)configuration
                          onManifest:(ABI39_0_0EXUpdatesManifestBlock)manifestBlock
                            progress:(ABI39_0_0EXUpdatesProgressBlock)progressBlock
                             success:(ABI39_0_0EXUpdatesSuccessBlock)successBlock
                               error:(ABI39_0_0EXUpdatesErrorBlock)errorBlock
{
  ABI39_0_0EXUpdatesAppController *controller = ABI39_0_0EXUpdatesAppController.sharedInstance;
  ABI39_0_0EXUpdatesConfig *updatesConfiguration = [ABI39_0_0EXUpdatesConfig configWithExpoPlist];
  [updatesConfiguration loadConfigFromDictionary:configuration];
  if (!updatesConfiguration.updateUrl) {
    errorBlock([NSError errorWithDomain:ABI39_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI39_0_0EXUpdatesDevLauncherErrorCodeInvalidUpdateURL userInfo:@{NSLocalizedDescriptionKey: @"Failed to load update: configuration object must include a valid update URL"}]);
    return;
  }
  NSError *fsError;
  if (![controller initializeUpdatesDirectoryWithError:&fsError]) {
    errorBlock(fsError ?: [NSError errorWithDomain:ABI39_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI39_0_0EXUpdatesDevLauncherErrorCodeDirectoryInitializationFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize updates directory with an unknown error"}]);
    return;
  }
  NSError *dbError;
  if (![controller initializeUpdatesDatabaseWithError:&dbError]) {
    errorBlock(dbError ?: [NSError errorWithDomain:ABI39_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI39_0_0EXUpdatesDevLauncherErrorCodeDatabaseInitializationFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize updates database with an unknown error"}]);
    return;
  }

  [controller setIsStarted:YES];
  [self _setDevelopmentSelectionPolicy];

  ABI39_0_0EXUpdatesRemoteAppLoader *loader = [[ABI39_0_0EXUpdatesRemoteAppLoader alloc] initWithConfig:updatesConfiguration database:controller.database directory:controller.updatesDirectory completionQueue:controller.controllerQueue];
  [loader loadUpdateFromUrl:updatesConfiguration.updateUrl onManifest:^BOOL(ABI39_0_0EXUpdatesUpdate * _Nonnull update) {
    return manifestBlock(update.rawManifest.rawManifestJSON);
  } asset:^(ABI39_0_0EXUpdatesAsset * _Nonnull asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    progressBlock(successfulAssetCount, failedAssetCount, totalAssetCount);
  } success:^(ABI39_0_0EXUpdatesUpdate * _Nullable update) {
    if (!update) {
      successBlock(nil);
      return;
    }
    [self _launchUpdate:update withConfiguration:updatesConfiguration success:successBlock error:errorBlock];
  } error:errorBlock];
}

- (void)_setDevelopmentSelectionPolicy
{
  ABI39_0_0EXUpdatesAppController *controller = ABI39_0_0EXUpdatesAppController.sharedInstance;
  ABI39_0_0EXUpdatesSelectionPolicy *currentSelectionPolicy = controller.selectionPolicy;
  [controller setDefaultSelectionPolicy:[[ABI39_0_0EXUpdatesSelectionPolicy alloc]
                                         initWithLauncherSelectionPolicy:currentSelectionPolicy.launcherSelectionPolicy
                                         loaderSelectionPolicy:currentSelectionPolicy.loaderSelectionPolicy
                                         reaperSelectionPolicy:[ABI39_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient new]]];
  [controller resetSelectionPolicyToDefault];
}

- (void)_launchUpdate:(ABI39_0_0EXUpdatesUpdate *)update
    withConfiguration:(ABI39_0_0EXUpdatesConfig *)configuration
              success:(ABI39_0_0EXUpdatesSuccessBlock)successBlock
                error:(ABI39_0_0EXUpdatesErrorBlock)errorBlock
{
  ABI39_0_0EXUpdatesAppController *controller = ABI39_0_0EXUpdatesAppController.sharedInstance;
  ABI39_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI39_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:configuration database:controller.database directory:controller.updatesDirectory completionQueue:controller.controllerQueue];
  [launcher launchUpdateWithSelectionPolicy:controller.selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
    if (!success) {
      errorBlock(error ?: [NSError errorWithDomain:ABI39_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI39_0_0EXUpdatesDevLauncherErrorCodeUpdateLaunchFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to launch update with an unknown error"}]);
      return;
    }

    [controller setConfigurationInternal:configuration];
    [controller setLauncher:launcher];
    successBlock(launcher.launchedUpdate.rawManifest.rawManifestJSON);
    [controller runReaper];
  }];
}

@end

NS_ASSUME_NONNULL_END
