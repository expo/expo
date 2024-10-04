//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppController+Internal.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppLauncherWithDatabase.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesConfig.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDevLauncherController.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesReaper.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesSelectionPolicy.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUpdate.h>
#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI44_0_0EXUpdatesDevLauncherControllerErrorDomain = @"ABI44_0_0EXUpdatesDevLauncherController";

typedef NS_ENUM(NSInteger, ABI44_0_0EXUpdatesDevLauncherErrorCode) {
  ABI44_0_0EXUpdatesDevLauncherErrorCodeInvalidUpdateURL = 1,
  ABI44_0_0EXUpdatesDevLauncherErrorCodeDirectoryInitializationFailed,
  ABI44_0_0EXUpdatesDevLauncherErrorCodeDatabaseInitializationFailed,
  ABI44_0_0EXUpdatesDevLauncherErrorCodeUpdateLaunchFailed,
};

@interface ABI44_0_0EXUpdatesDevLauncherController ()

@property (nonatomic, strong) ABI44_0_0EXUpdatesConfig *tempConfig;

@end

@implementation ABI44_0_0EXUpdatesDevLauncherController

@synthesize bridge = _bridge;

+ (instancetype)sharedInstance
{
  static ABI44_0_0EXUpdatesDevLauncherController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [ABI44_0_0EXUpdatesDevLauncherController new];
    }
  });
  return theController;
}

- (void)setBridge:(nullable id)bridge
{
  _bridge = bridge;
  if ([bridge isKindOfClass:[ABI44_0_0RCTBridge class]]) {
    ABI44_0_0EXUpdatesAppController.sharedInstance.bridge = (ABI44_0_0RCTBridge *)bridge;
  }
}

- (void)reset
{
  ABI44_0_0EXUpdatesAppController *controller = ABI44_0_0EXUpdatesAppController.sharedInstance;
  [controller setLauncher:nil];
  [controller setIsStarted:NO];
}

- (NSURL *)launchAssetURL
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.launchAssetUrl;
}

- (void)fetchUpdateWithConfiguration:(NSDictionary *)configuration
                          onManifest:(ABI44_0_0EXUpdatesManifestBlock)manifestBlock
                            progress:(ABI44_0_0EXUpdatesProgressBlock)progressBlock
                             success:(ABI44_0_0EXUpdatesSuccessBlock)successBlock
                               error:(ABI44_0_0EXUpdatesErrorBlock)errorBlock
{
  ABI44_0_0EXUpdatesAppController *controller = ABI44_0_0EXUpdatesAppController.sharedInstance;
  ABI44_0_0EXUpdatesConfig *updatesConfiguration = [ABI44_0_0EXUpdatesConfig configWithExpoPlist];
  [updatesConfiguration loadConfigFromDictionary:configuration];
  if (!updatesConfiguration.updateUrl || !updatesConfiguration.scopeKey) {
    errorBlock([NSError errorWithDomain:ABI44_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI44_0_0EXUpdatesDevLauncherErrorCodeInvalidUpdateURL userInfo:@{NSLocalizedDescriptionKey: @"Failed to load update: configuration object must include a valid update URL"}]);
    return;
  }
  NSError *fsError;
  if (![controller initializeUpdatesDirectoryWithError:&fsError]) {
    errorBlock(fsError ?: [NSError errorWithDomain:ABI44_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI44_0_0EXUpdatesDevLauncherErrorCodeDirectoryInitializationFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize updates directory with an unknown error"}]);
    return;
  }
  NSError *dbError;
  if (![controller initializeUpdatesDatabaseWithError:&dbError]) {
    errorBlock(dbError ?: [NSError errorWithDomain:ABI44_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI44_0_0EXUpdatesDevLauncherErrorCodeDatabaseInitializationFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize updates database with an unknown error"}]);
    return;
  }

  // since controller is a singleton, save its config so we can reset to it if our request fails
  _tempConfig = controller.config;

  [self _setDevelopmentSelectionPolicy];
  [controller setConfigurationInternal:updatesConfiguration];

  ABI44_0_0EXUpdatesRemoteAppLoader *loader = [[ABI44_0_0EXUpdatesRemoteAppLoader alloc] initWithConfig:updatesConfiguration database:controller.database directory:controller.updatesDirectory completionQueue:controller.controllerQueue];
  [loader loadUpdateFromUrl:updatesConfiguration.updateUrl onManifest:^BOOL(ABI44_0_0EXUpdatesUpdate * _Nonnull update) {
    return manifestBlock(update.manifest.rawManifestJSON);
  } asset:^(ABI44_0_0EXUpdatesAsset * _Nonnull asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    progressBlock(successfulAssetCount, failedAssetCount, totalAssetCount);
  } success:^(ABI44_0_0EXUpdatesUpdate * _Nullable update) {
    if (!update) {
      successBlock(nil);
      return;
    }
    [self _launchUpdate:update withConfiguration:updatesConfiguration success:successBlock error:errorBlock];
  } error:errorBlock];
}

- (void)_setDevelopmentSelectionPolicy
{
  ABI44_0_0EXUpdatesAppController *controller = ABI44_0_0EXUpdatesAppController.sharedInstance;
  ABI44_0_0EXUpdatesSelectionPolicy *currentSelectionPolicy = controller.selectionPolicy;
  [controller setDefaultSelectionPolicy:[[ABI44_0_0EXUpdatesSelectionPolicy alloc]
                                         initWithLauncherSelectionPolicy:currentSelectionPolicy.launcherSelectionPolicy
                                         loaderSelectionPolicy:currentSelectionPolicy.loaderSelectionPolicy
                                         reaperSelectionPolicy:[ABI44_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient new]]];
  [controller resetSelectionPolicyToDefault];
}

- (void)_launchUpdate:(ABI44_0_0EXUpdatesUpdate *)update
    withConfiguration:(ABI44_0_0EXUpdatesConfig *)configuration
              success:(ABI44_0_0EXUpdatesSuccessBlock)successBlock
                error:(ABI44_0_0EXUpdatesErrorBlock)errorBlock
{
  ABI44_0_0EXUpdatesAppController *controller = ABI44_0_0EXUpdatesAppController.sharedInstance;
  ABI44_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI44_0_0EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:configuration database:controller.database directory:controller.updatesDirectory completionQueue:controller.controllerQueue];
  [launcher launchUpdateWithSelectionPolicy:controller.selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
    if (!success) {
      errorBlock(error ?: [NSError errorWithDomain:ABI44_0_0EXUpdatesDevLauncherControllerErrorDomain code:ABI44_0_0EXUpdatesDevLauncherErrorCodeUpdateLaunchFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to launch update with an unknown error"}]);
      // reset controller's configuration to what it was before this request
      [controller setConfigurationInternal:self->_tempConfig];
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
