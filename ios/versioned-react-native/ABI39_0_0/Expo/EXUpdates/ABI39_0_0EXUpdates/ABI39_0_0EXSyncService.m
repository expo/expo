// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncController.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncService.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI39_0_0EXSyncService

ABI39_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI39_0_0EXSyncInterface)];
}

- (ABI39_0_0EXSyncConfig *)config
{
  return ABI39_0_0EXSyncController.sharedInstance.config;
}

- (ABI39_0_0EXSyncDatabase *)database
{
  return ABI39_0_0EXSyncController.sharedInstance.database;
}

- (id<ABI39_0_0EXSyncSelectionPolicy>)selectionPolicy
{
  return ABI39_0_0EXSyncController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI39_0_0EXSyncController.sharedInstance.updatesDirectory;
}

- (nullable ABI39_0_0EXSyncManifest *)launchedUpdate
{
  return ABI39_0_0EXSyncController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI39_0_0EXSyncController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI39_0_0EXSyncController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI39_0_0EXSyncController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI39_0_0EXSyncController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI39_0_0EXSyncController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI39_0_0EXSyncRelaunchCompletionBlock)completion
{
  return [ABI39_0_0EXSyncController.sharedInstance requestRelaunchWithCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END
