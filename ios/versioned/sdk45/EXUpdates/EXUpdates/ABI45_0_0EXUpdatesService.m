// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesAppController.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesService.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI45_0_0EXUpdatesService

ABI45_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI45_0_0EXUpdatesModuleInterface)];
}

- (ABI45_0_0EXUpdatesConfig *)config
{
  return ABI45_0_0EXUpdatesAppController.sharedInstance.config;
}

- (ABI45_0_0EXUpdatesDatabase *)database
{
  return ABI45_0_0EXUpdatesAppController.sharedInstance.database;
}

- (ABI45_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return ABI45_0_0EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI45_0_0EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable ABI45_0_0EXUpdatesUpdate *)embeddedUpdate
{
  return [ABI45_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:self.config database:self.database];
}

- (nullable ABI45_0_0EXUpdatesUpdate *)launchedUpdate
{
  return ABI45_0_0EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI45_0_0EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI45_0_0EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI45_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI45_0_0EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI45_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI45_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [ABI45_0_0EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

- (void)resetSelectionPolicy
{
  return [ABI45_0_0EXUpdatesAppController.sharedInstance resetSelectionPolicyToDefault];
}

@end

NS_ASSUME_NONNULL_END
