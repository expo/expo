// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesAppController.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesService.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI40_0_0EXUpdatesService

ABI40_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI40_0_0EXUpdatesInterface)];
}

- (ABI40_0_0EXUpdatesConfig *)config
{
  return ABI40_0_0EXUpdatesAppController.sharedInstance.config;
}

- (ABI40_0_0EXUpdatesDatabase *)database
{
  return ABI40_0_0EXUpdatesAppController.sharedInstance.database;
}

- (id<ABI40_0_0EXUpdatesSelectionPolicy>)selectionPolicy
{
  return ABI40_0_0EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI40_0_0EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable ABI40_0_0EXUpdatesUpdate *)launchedUpdate
{
  return ABI40_0_0EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI40_0_0EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI40_0_0EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI40_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI40_0_0EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI40_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI40_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [ABI40_0_0EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END
