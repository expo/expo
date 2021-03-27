// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncController.h>
#import <EXUpdates/EXSyncService.h>
#import <UMCore/UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXSyncService

UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXSyncInterface)];
}

- (EXSyncConfig *)config
{
  return EXSyncController.sharedInstance.config;
}

- (EXSyncDatabase *)database
{
  return EXSyncController.sharedInstance.database;
}

- (id<EXSyncSelectionPolicy>)selectionPolicy
{
  return EXSyncController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return EXSyncController.sharedInstance.updatesDirectory;
}

- (nullable EXSyncManifest *)launchedUpdate
{
  return EXSyncController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return EXSyncController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return EXSyncController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return EXSyncController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return EXSyncController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return EXSyncController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(EXSyncRelaunchCompletionBlock)completion
{
  return [EXSyncController.sharedInstance requestRelaunchWithCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END
