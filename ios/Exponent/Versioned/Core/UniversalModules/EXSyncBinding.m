// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXUpdates/EXSyncService.h>)

#import "EXSyncBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncBinding ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, weak) id<EXSyncBindingDelegate> updatesKernelService;
@property (nonatomic, weak) id<EXSyncDatabaseBindingDelegate> databaseKernelService;

@end

@implementation EXSyncBinding : EXSyncService

- (instancetype)initWithExperienceId:(NSString *)experienceId updatesKernelService:(id<EXSyncBindingDelegate>)updatesKernelService databaseKernelService:(id<EXSyncDatabaseBindingDelegate>)databaseKernelService
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _updatesKernelService = updatesKernelService;
    _databaseKernelService = databaseKernelService;
  }
  return self;
}

- (EXSyncConfig *)config
{
  return [_updatesKernelService configForExperienceId:_experienceId];
}

- (EXSyncDatabase *)database
{
  return _databaseKernelService.database;
}

- (id<EXSyncSelectionPolicy>)selectionPolicy
{
  return [_updatesKernelService selectionPolicyForExperienceId:_experienceId];
}

- (NSURL *)directory
{
  return _databaseKernelService.updatesDirectory;
}

- (nullable EXSyncManifest *)launchedUpdate
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

- (void)requestRelaunchWithCompletion:(EXSyncRelaunchCompletionBlock)completion
{
  return [_updatesKernelService requestRelaunchForExperienceId:_experienceId withCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END

#endif
