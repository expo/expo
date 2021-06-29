// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesAppController.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesService.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI42_0_0EXUpdatesService

ABI42_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI42_0_0EXUpdatesModuleInterface)];
}

- (ABI42_0_0EXUpdatesConfig *)config
{
  return ABI42_0_0EXUpdatesAppController.sharedInstance.config;
}

- (ABI42_0_0EXUpdatesDatabase *)database
{
  return ABI42_0_0EXUpdatesAppController.sharedInstance.database;
}

- (ABI42_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return ABI42_0_0EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI42_0_0EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable ABI42_0_0EXUpdatesUpdate *)launchedUpdate
{
  return ABI42_0_0EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI42_0_0EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI42_0_0EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI42_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI42_0_0EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI42_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI42_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [ABI42_0_0EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

- (void)resetSelectionPolicy
{
  return [ABI42_0_0EXUpdatesAppController.sharedInstance resetSelectionPolicyToDefault];
}

@end

NS_ASSUME_NONNULL_END
