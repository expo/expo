// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppController.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesService.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI43_0_0EXUpdatesService

ABI43_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI43_0_0EXUpdatesModuleInterface)];
}

- (ABI43_0_0EXUpdatesConfig *)config
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.config;
}

- (ABI43_0_0EXUpdatesDatabase *)database
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.database;
}

- (ABI43_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable ABI43_0_0EXUpdatesUpdate *)launchedUpdate
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI43_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI43_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [ABI43_0_0EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

- (void)resetSelectionPolicy
{
  return [ABI43_0_0EXUpdatesAppController.sharedInstance resetSelectionPolicyToDefault];
}

@end

NS_ASSUME_NONNULL_END
