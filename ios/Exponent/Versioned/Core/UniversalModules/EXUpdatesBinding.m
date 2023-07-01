// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXUpdates/EXUpdatesService.h>)

#import "EXUpdatesBinding.h"

#import <objc/runtime.h>

#import "ExpoModulesCore-Swift.h"
#if __has_include(<EXUpdatesInterface/EXUpdatesInterface-Swift.h>)
#import <EXUpdatesInterface/EXUpdatesInterface-Swift.h>
#else
#import "EXUpdatesInterface-Swift.h"
#endif
#import "EXUpdates-Swift.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBinding ()

@property (nonatomic, strong) NSString *scopeKey;
@property (nonatomic, weak) id<EXUpdatesBindingDelegate> updatesKernelService;
@property (nonatomic, weak) id<EXUpdatesDatabaseBindingDelegate> databaseKernelService;

@end

/**
 * Scoped internal module which overrides EXUpdatesService at runtime in Expo Go, and gives
 * EXUpdatesModule access to properties from the correct instance of EXAppLoaderExpoUpdates (through
 * EXUpdatesKernelService) as well as the global database object (through
 * EXUpdatesDatabaseKernelService).
 */
@implementation EXUpdatesBinding : EXUpdatesService

- (instancetype)initWithScopeKey:(NSString *)scopeKey updatesKernelService:(id<EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<EXUpdatesDatabaseBindingDelegate>)databaseKernelService
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
    _updatesKernelService = updatesKernelService;
    _databaseKernelService = databaseKernelService;
  }
  return self;
}

- (nullable EXUpdatesConfig *)config
{
  EXUpdatesConfig *config = [_updatesKernelService configForScopeKey:_scopeKey];
  // Ensures the universal UpdatesConfig can cast to versioned UpdatesConfig without exception in Swift
  object_setClass(config, [EXUpdatesConfig class]);
  return config;
}

- (EXUpdatesDatabase *)database
{
  return _databaseKernelService.database;
}

- (nullable EXUpdatesSelectionPolicy *)selectionPolicy
{
  return [_updatesKernelService selectionPolicyForScopeKey:_scopeKey];
}

- (NSURL *)directory
{
  return _databaseKernelService.updatesDirectory;
}

- (nullable EXUpdatesUpdate *)embeddedUpdate
{
  return nil;
}

- (nullable EXUpdatesUpdate *)launchedUpdate
{
  EXUpdatesUpdate *update = [_updatesKernelService launchedUpdateForScopeKey:_scopeKey];
  // Ensures the universal UpdatesUpdate can cast to versioned UpdatesUpdate without exception in Swift
  object_setClass(update, [EXUpdatesUpdate class]);
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

- (void)requestRelaunchWithCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [_updatesKernelService requestRelaunchForScopeKey:_scopeKey withCompletion:completion];
}

- (void)resetSelectionPolicy
{
  // no-op in managed
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(EXUpdatesModuleInterface)];
}

@end

NS_ASSUME_NONNULL_END

#endif
