// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI41_0_0EXUpdates/ABI41_0_0EXSyncService.h>)

#import "ABI41_0_0EXSyncBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXSyncBinding ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, weak) id<ABI41_0_0EXSyncBindingDelegate> updatesKernelService;
@property (nonatomic, weak) id<ABI41_0_0EXSyncDatabaseBindingDelegate> databaseKernelService;

@end

@implementation ABI41_0_0EXSyncBinding : ABI41_0_0EXSyncService

- (instancetype)initWithExperienceId:(NSString *)experienceId updatesKernelService:(id<ABI41_0_0EXSyncBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI41_0_0EXSyncDatabaseBindingDelegate>)databaseKernelService
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _updatesKernelService = updatesKernelService;
    _databaseKernelService = databaseKernelService;
  }
  return self;
}

- (ABI41_0_0EXSyncConfig *)config
{
  return [_updatesKernelService configForExperienceId:_experienceId];
}

- (ABI41_0_0EXSyncDatabase *)database
{
  return _databaseKernelService.database;
}

- (id<ABI41_0_0EXSyncSelectionPolicy>)selectionPolicy
{
  return [_updatesKernelService selectionPolicyForExperienceId:_experienceId];
}

- (NSURL *)directory
{
  return _databaseKernelService.updatesDirectory;
}

- (nullable ABI41_0_0EXSyncManifest *)launchedUpdate
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

- (void)requestRelaunchWithCompletion:(ABI41_0_0EXSyncRelaunchCompletionBlock)completion
{
  return [_updatesKernelService requestRelaunchForExperienceId:_experienceId withCompletion:completion];
}

@end

NS_ASSUME_NONNULL_END

#endif
