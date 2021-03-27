// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncController.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncService.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI41_0_0EXSyncService

ABI41_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI41_0_0EXSyncInterface)];
}

- (ABI41_0_0EXSyncConfig *)config
{
  return ABI41_0_0EXSyncController.sharedInstance.config;
}

- (ABI41_0_0EXSyncDatabase *)database
{
  return ABI41_0_0EXSyncController.sharedInstance.database;
}

- (id<ABI41_0_0EXSyncSelectionPolicy>)selectionPolicy
{
  return ABI41_0_0EXSyncController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI41_0_0EXSyncController.sharedInstance.updatesDirectory;
}

- (nullable ABI41_0_0EXSyncManifest *)launchedUpdate
{
  return ABI41_0_0EXSyncController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI41_0_0EXSyncController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI41_0_0EXSyncController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI41_0_0EXSyncController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI41_0_0EXSyncController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI41_0_0EXSyncController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI41_0_0EXSyncRelaunchCompletionBlock)completion
{
  return [ABI41_0_0EXSyncController.sharedInstance requestRelaunchWithCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END
