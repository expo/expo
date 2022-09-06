// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesService.h>)

#import "ABI46_0_0EXUpdatesBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXUpdatesBinding ()

@property (nonatomic, strong) NSString *scopeKey;
@property (nonatomic, weak) id<ABI46_0_0EXUpdatesBindingDelegate> updatesKernelService;
@property (nonatomic, weak) id<ABI46_0_0EXUpdatesDatabaseBindingDelegate> databaseKernelService;

@end

@implementation ABI46_0_0EXUpdatesBinding : ABI46_0_0EXUpdatesService

- (instancetype)initWithScopeKey:(NSString *)scopeKey updatesKernelService:(id<ABI46_0_0EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI46_0_0EXUpdatesDatabaseBindingDelegate>)databaseKernelService
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
    _updatesKernelService = updatesKernelService;
    _databaseKernelService = databaseKernelService;
  }
  return self;
}

- (ABI46_0_0EXUpdatesConfig *)config
{
  return [_updatesKernelService configForScopeKey:_scopeKey];
}

- (ABI46_0_0EXUpdatesDatabase *)database
{
  return _databaseKernelService.database;
}

- (ABI46_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return [_updatesKernelService selectionPolicyForScopeKey:_scopeKey];
}

- (NSURL *)directory
{
  return _databaseKernelService.updatesDirectory;
}

- (nullable ABI46_0_0EXUpdatesUpdate *)embeddedUpdate
{
  return nil;
}

- (nullable ABI46_0_0EXUpdatesUpdate *)launchedUpdate
{
  return [_updatesKernelService launchedUpdateForScopeKey:_scopeKey];
}

- (nullable NSDictionary *)assetFilesMap
{
  return [_updatesKernelService assetFilesMapForScopeKey:_scopeKey];
}

- (BOOL)isUsingEmbeddedAssets
{
  return [_updatesKernelService isUsingEmbeddedAssetsForScopeKey:_scopeKey];
}

- (BOOL)isStarted
{
  return [_updatesKernelService isStartedForScopeKey:_scopeKey];
}

- (BOOL)isEmergencyLaunch
{
  return [_updatesKernelService isEmergencyLaunchForScopeKey:_scopeKey];
}

- (BOOL)canRelaunch
{
  return YES;
}

- (void)requestRelaunchWithCompletion:(ABI46_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [_updatesKernelService requestRelaunchForScopeKey:_scopeKey withCompletion:completion];
}

- (void)resetSelectionPolicy
{
  // no-op in managed
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI46_0_0EXUpdatesModuleInterface)];
}

@end

NS_ASSUME_NONNULL_END

#endif
