// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesService.h>)

#import "ABI42_0_0EXUpdatesBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesBinding ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, weak) id<ABI42_0_0EXUpdatesBindingDelegate> updatesKernelService;
@property (nonatomic, weak) id<ABI42_0_0EXUpdatesDatabaseBindingDelegate> databaseKernelService;

@end

@implementation ABI42_0_0EXUpdatesBinding : ABI42_0_0EXUpdatesService

- (instancetype)initWithExperienceId:(NSString *)experienceId updatesKernelService:(id<ABI42_0_0EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI42_0_0EXUpdatesDatabaseBindingDelegate>)databaseKernelService
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _updatesKernelService = updatesKernelService;
    _databaseKernelService = databaseKernelService;
  }
  return self;
}

- (ABI42_0_0EXUpdatesConfig *)config
{
  return [_updatesKernelService configForExperienceId:_experienceId];
}

- (ABI42_0_0EXUpdatesDatabase *)database
{
  return _databaseKernelService.database;
}

- (ABI42_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return [_updatesKernelService selectionPolicyForExperienceId:_experienceId];
}

- (NSURL *)directory
{
  return _databaseKernelService.updatesDirectory;
}

- (nullable ABI42_0_0EXUpdatesUpdate *)launchedUpdate
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

- (void)requestRelaunchWithCompletion:(ABI42_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [_updatesKernelService requestRelaunchForExperienceId:_experienceId withCompletion:completion];
}

- (void)resetSelectionPolicy
{
  // no-op in managed
}

@end

NS_ASSUME_NONNULL_END

#endif
