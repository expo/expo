// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesAppController.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesService.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI39_0_0EXUpdatesService

ABI39_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI39_0_0EXUpdatesInterface)];
}

- (ABI39_0_0EXUpdatesConfig *)config
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.config;
}

- (ABI39_0_0EXUpdatesDatabase *)database
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.database;
}

- (id<ABI39_0_0EXUpdatesSelectionPolicy>)selectionPolicy
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable ABI39_0_0EXUpdatesUpdate *)launchedUpdate
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI39_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI39_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [ABI39_0_0EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END
