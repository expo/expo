// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncController.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncService.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI40_0_0EXSyncService

ABI40_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI40_0_0EXSyncInterface)];
}

- (ABI40_0_0EXSyncConfig *)config
{
  return ABI40_0_0EXSyncController.sharedInstance.config;
}

- (ABI40_0_0EXSyncDatabase *)database
{
  return ABI40_0_0EXSyncController.sharedInstance.database;
}

- (id<ABI40_0_0EXSyncSelectionPolicy>)selectionPolicy
{
  return ABI40_0_0EXSyncController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI40_0_0EXSyncController.sharedInstance.updatesDirectory;
}

- (nullable ABI40_0_0EXSyncManifest *)launchedUpdate
{
  return ABI40_0_0EXSyncController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI40_0_0EXSyncController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI40_0_0EXSyncController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI40_0_0EXSyncController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI40_0_0EXSyncController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI40_0_0EXSyncController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI40_0_0EXSyncRelaunchCompletionBlock)completion
{
  return [ABI40_0_0EXSyncController.sharedInstance requestRelaunchWithCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END
