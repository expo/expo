// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppController.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesService.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI44_0_0EXUpdatesService

ABI44_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI44_0_0EXUpdatesModuleInterface)];
}

- (ABI44_0_0EXUpdatesConfig *)config
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.config;
}

- (ABI44_0_0EXUpdatesDatabase *)database
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.database;
}

- (ABI44_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable ABI44_0_0EXUpdatesUpdate *)embeddedUpdate
{
  return [ABI44_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:self.config database:self.database];
}

- (nullable ABI44_0_0EXUpdatesUpdate *)launchedUpdate
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI44_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI44_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [ABI44_0_0EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

- (void)resetSelectionPolicy
{
  return [ABI44_0_0EXUpdatesAppController.sharedInstance resetSelectionPolicyToDefault];
}

@end

NS_ASSUME_NONNULL_END
