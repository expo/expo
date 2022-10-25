// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesService.h>)

#import "ABI47_0_0EXUpdatesBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXUpdatesBinding ()

@property (nonatomic, strong) NSString *scopeKey;
@property (nonatomic, weak) id<ABI47_0_0EXUpdatesBindingDelegate> updatesKernelService;
@property (nonatomic, weak) id<ABI47_0_0EXUpdatesDatabaseBindingDelegate> databaseKernelService;

@end

/**
 * Scoped internal module which overrides ABI47_0_0EXUpdatesService at runtime in Expo Go, and gives
 * ABI47_0_0EXUpdatesModule access to properties from the correct instance of ABI47_0_0EXAppLoaderExpoUpdates (through
 * ABI47_0_0EXUpdatesKernelService) as well as the global database object (through
 * ABI47_0_0EXUpdatesDatabaseKernelService).
 */
@implementation ABI47_0_0EXUpdatesBinding : ABI47_0_0EXUpdatesService

- (instancetype)initWithScopeKey:(NSString *)scopeKey updatesKernelService:(id<ABI47_0_0EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI47_0_0EXUpdatesDatabaseBindingDelegate>)databaseKernelService
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
    _updatesKernelService = updatesKernelService;
    _databaseKernelService = databaseKernelService;
  }
  return self;
}

- (ABI47_0_0EXUpdatesConfig *)config
{
  return [_updatesKernelService configForScopeKey:_scopeKey];
}

- (ABI47_0_0EXUpdatesDatabase *)database
{
  return _databaseKernelService.database;
}

- (ABI47_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return [_updatesKernelService selectionPolicyForScopeKey:_scopeKey];
}

- (NSURL *)directory
{
  return _databaseKernelService.updatesDirectory;
}

- (nullable ABI47_0_0EXUpdatesUpdate *)embeddedUpdate
{
  return nil;
}

- (nullable ABI47_0_0EXUpdatesUpdate *)launchedUpdate
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

- (void)requestRelaunchWithCompletion:(ABI47_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [_updatesKernelService requestRelaunchForScopeKey:_scopeKey withCompletion:completion];
}

- (void)resetSelectionPolicy
{
  // no-op in managed
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI47_0_0EXUpdatesModuleInterface)];
}

@end

NS_ASSUME_NONNULL_END

#endif
