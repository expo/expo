// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXUpdates/EXUpdatesService.h>)

#import "EXUpdatesBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBinding ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, weak) id<EXUpdatesBindingDelegate> updatesKernelService;
@property (nonatomic, weak) id<EXUpdatesDatabaseBindingDelegate> databaseKernelService;

@end

@implementation EXUpdatesBinding : EXUpdatesService

- (instancetype)initWithExperienceId:(NSString *)experienceId updatesKernelService:(id<EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<EXUpdatesDatabaseBindingDelegate>)databaseKernelService
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _updatesKernelService = updatesKernelService;
    _databaseKernelService = databaseKernelService;
  }
  return self;
}

- (EXUpdatesConfig *)config
{
  return [_updatesKernelService configForExperienceId:_experienceId];
}

- (EXUpdatesDatabase *)database
{
  return _databaseKernelService.database;
}

- (EXUpdatesSelectionPolicy *)selectionPolicy
{
  return [_updatesKernelService selectionPolicyForExperienceId:_experienceId];
}

- (NSURL *)directory
{
  return _databaseKernelService.updatesDirectory;
}

- (nullable EXUpdatesUpdate *)launchedUpdate
{
  return [_updatesKernelService launchedUpdateForExperienceId:_experienceId];
}

- (nullable NSDictionary *)assetFilesMap
{
  return [_updatesKernelService assetFilesMapForExperienceId:_experienceId];
}

- (BOOL)isUsingEmbeddedAssets
{
  return [_updatesKernelService isUsingEmbeddedAssetsForExperienceId:_experienceId];
}

- (BOOL)isStarted
{
  return [_updatesKernelService isStartedForExperienceId:_experienceId];
}

- (BOOL)isEmergencyLaunch
{
  return [_updatesKernelService isEmergencyLaunchForExperienceId:_experienceId];
}

- (BOOL)canRelaunch
{
  return YES;
}

- (void)requestRelaunchWithCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [_updatesKernelService requestRelaunchForExperienceId:_experienceId withCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END

#endif
