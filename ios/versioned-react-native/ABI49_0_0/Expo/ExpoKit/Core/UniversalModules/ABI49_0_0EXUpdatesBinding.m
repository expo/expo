// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI49_0_0EXUpdates/ABI49_0_0EXUpdatesService.h>)

#import "ABI49_0_0EXUpdatesBinding.h"

#import <objc/runtime.h>

#import "ABI49_0_0ExpoModulesCore-Swift.h"
#if __has_include(<ABI49_0_0EXUpdatesInterface/ABI49_0_0EXUpdatesInterface-Swift.h>)
#import <ABI49_0_0EXUpdatesInterface/ABI49_0_0EXUpdatesInterface-Swift.h>
#else
#import "ABI49_0_0EXUpdatesInterface-Swift.h"
#endif
#import "ABI49_0_0EXUpdates-Swift.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0EXUpdatesBinding ()

@property (nonatomic, strong) NSString *scopeKey;
@property (nonatomic, weak) id<ABI49_0_0EXUpdatesBindingDelegate> updatesKernelService;
@property (nonatomic, weak) id<ABI49_0_0EXUpdatesDatabaseBindingDelegate> databaseKernelService;

@end

/**
 * Scoped internal module which overrides ABI49_0_0EXUpdatesService at runtime in Expo Go, and gives
 * ABI49_0_0EXUpdatesModule access to properties from the correct instance of ABI49_0_0EXAppLoaderExpoUpdates (through
 * ABI49_0_0EXUpdatesKernelService) as well as the global database object (through
 * ABI49_0_0EXUpdatesDatabaseKernelService).
 */
@implementation ABI49_0_0EXUpdatesBinding : ABI49_0_0EXUpdatesService

- (instancetype)initWithScopeKey:(NSString *)scopeKey updatesKernelService:(id<ABI49_0_0EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI49_0_0EXUpdatesDatabaseBindingDelegate>)databaseKernelService
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
    _updatesKernelService = updatesKernelService;
    _databaseKernelService = databaseKernelService;
  }
  return self;
}

- (nullable ABI49_0_0EXUpdatesConfig *)config
{
  ABI49_0_0EXUpdatesConfig *config = [_updatesKernelService configForScopeKey:_scopeKey];
  // Ensures the universal UpdatesConfig can cast to versioned UpdatesConfig without exception in Swift
  object_setClass(config, [ABI49_0_0EXUpdatesConfig class]);
  return config;
}

- (ABI49_0_0EXUpdatesDatabase *)database
{
  return _databaseKernelService.database;
}

- (nullable ABI49_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return [_updatesKernelService selectionPolicyForScopeKey:_scopeKey];
}

- (NSURL *)directory
{
  return _databaseKernelService.updatesDirectory;
}

- (nullable ABI49_0_0EXUpdatesUpdate *)embeddedUpdate
{
  return nil;
}

- (nullable ABI49_0_0EXUpdatesUpdate *)launchedUpdate
{
  ABI49_0_0EXUpdatesUpdate *update = [_updatesKernelService launchedUpdateForScopeKey:_scopeKey];
  // Ensures the universal UpdatesUpdate can cast to versioned UpdatesUpdate without exception in Swift
  object_setClass(update, [ABI49_0_0EXUpdatesUpdate class]);
  return update;
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

- (BOOL)canCheckForUpdateAndFetchUpdate
{
  // not allowed in managed
  return NO;
}

- (void)requestRelaunchWithCompletion:(ABI49_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [_updatesKernelService requestRelaunchForScopeKey:_scopeKey withCompletion:completion];
}

- (void)resetSelectionPolicy
{
  // no-op in managed
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI49_0_0EXUpdatesModuleInterface)];
}

@end

NS_ASSUME_NONNULL_END

#endif
