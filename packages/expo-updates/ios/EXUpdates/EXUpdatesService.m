// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesService.h>
#import <UMCore/UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesService

UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXUpdatesInterface)];
}

- (EXUpdatesConfig *)config
{
  return EXUpdatesAppController.sharedInstance.config;
}

- (EXUpdatesDatabase *)database
{
  return EXUpdatesAppController.sharedInstance.database;
}

- (id<EXUpdatesSelectionPolicy>)selectionPolicy
{
  return EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable EXUpdatesUpdate *)launchedUpdate
{
  return EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END
