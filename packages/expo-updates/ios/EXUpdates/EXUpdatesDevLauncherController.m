//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController+Internal.h>
#import <EXUpdates/EXUpdatesAppLauncherWithDatabase.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDevLauncherController.h>
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
                             success:(EXUpdatesSuccessBlock)successBlock
                               error:(EXUpdatesErrorBlock)errorBlock
{
  EXUpdatesAppController *controller = EXUpdatesAppController.sharedInstance;
  EXUpdatesConfig *updatesConfiguration = [EXUpdatesConfig configWithExpoPlist];
  [updatesConfiguration loadConfigFromDictionary:configuration];
  if (!updatesConfiguration.updateUrl || !updatesConfiguration.scopeKey) {
    errorBlock([NSError errorWithDomain:EXUpdatesDevLauncherControllerErrorDomain code:EXUpdatesDevLauncherErrorCodeInvalidUpdateURL userInfo:@{NSLocalizedDescriptionKey: @"Failed to load update: configuration object must include a valid update URL"}]);
    return;
  }
  NSError *fsError;
  if (![controller initializeUpdatesDirectoryWithError:&fsError]) {
    errorBlock(fsError ?: [NSError errorWithDomain:EXUpdatesDevLauncherControllerErrorDomain code:EXUpdatesDevLauncherErrorCodeDirectoryInitializationFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize updates directory with an unknown error"}]);
    return;
  }
  NSError *dbError;
  if (![controller initializeUpdatesDatabaseWithError:&dbError]) {
    errorBlock(dbError ?: [NSError errorWithDomain:EXUpdatesDevLauncherControllerErrorDomain code:EXUpdatesDevLauncherErrorCodeDatabaseInitializationFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize updates database with an unknown error"}]);
    return;
  }

  // since controller is a singleton, save its config so we can reset to it if our request fails
  _tempConfig = controller.config;

  [self _setDevelopmentSelectionPolicy];
  [controller setConfigurationInternal:updatesConfiguration];

  EXUpdatesRemoteAppLoader *loader = [[EXUpdatesRemoteAppLoader alloc] initWithConfig:updatesConfiguration database:controller.database directory:controller.updatesDirectory completionQueue:controller.controllerQueue];
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
  } error:errorBlock];
}

- (void)_setDevelopmentSelectionPolicy
{
  EXUpdatesAppController *controller = EXUpdatesAppController.sharedInstance;
  EXUpdatesSelectionPolicy *currentSelectionPolicy = controller.selectionPolicy;
  [controller setDefaultSelectionPolicy:[[EXUpdatesSelectionPolicy alloc]
                                         initWithLauncherSelectionPolicy:currentSelectionPolicy.launcherSelectionPolicy
                                         loaderSelectionPolicy:currentSelectionPolicy.loaderSelectionPolicy
                                         reaperSelectionPolicy:[EXUpdatesReaperSelectionPolicyDevelopmentClient new]]];
  [controller resetSelectionPolicyToDefault];
}

- (void)_launchUpdate:(EXUpdatesUpdate *)update
    withConfiguration:(EXUpdatesConfig *)configuration
              success:(EXUpdatesSuccessBlock)successBlock
                error:(EXUpdatesErrorBlock)errorBlock
{
  EXUpdatesAppController *controller = EXUpdatesAppController.sharedInstance;
  EXUpdatesAppLauncherWithDatabase *launcher = [[EXUpdatesAppLauncherWithDatabase alloc] initWithConfig:configuration database:controller.database directory:controller.updatesDirectory completionQueue:controller.controllerQueue];
  [launcher launchUpdateWithSelectionPolicy:controller.selectionPolicy completion:^(NSError * _Nullable error, BOOL success) {
    if (!success) {
      errorBlock(error ?: [NSError errorWithDomain:EXUpdatesDevLauncherControllerErrorDomain code:EXUpdatesDevLauncherErrorCodeUpdateLaunchFailed userInfo:@{NSLocalizedDescriptionKey: @"Failed to launch update with an unknown error"}]);
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
