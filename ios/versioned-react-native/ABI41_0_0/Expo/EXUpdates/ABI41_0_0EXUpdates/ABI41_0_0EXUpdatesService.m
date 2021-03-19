// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesAppController.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesService.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI41_0_0EXUpdatesService

ABI41_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI41_0_0EXUpdatesInterface)];
}

- (ABI41_0_0EXUpdatesConfig *)config
{
  return ABI41_0_0EXUpdatesAppController.sharedInstance.config;
}

- (ABI41_0_0EXUpdatesDatabase *)database
{
  return ABI41_0_0EXUpdatesAppController.sharedInstance.database;
}

- (id<ABI41_0_0EXUpdatesSelectionPolicy>)selectionPolicy
{
  return ABI41_0_0EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI41_0_0EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable ABI41_0_0EXUpdatesUpdate *)launchedUpdate
{
  return ABI41_0_0EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI41_0_0EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI41_0_0EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI41_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI41_0_0EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI41_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI41_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [ABI41_0_0EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END
