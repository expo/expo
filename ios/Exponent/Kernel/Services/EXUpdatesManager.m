// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppLoader+Updates.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelAppRecord.h"
#import "EXReactAppManager.h"
#import "EXScopedModuleRegistry.h"
#import "EXUpdatesDatabaseManager.h"
#import "EXUpdatesManager.h"

#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesRemoteAppLoader.h>

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

NSString * const EXUpdatesEventName = @"Expo.nativeUpdatesEvent";
NSString * const EXUpdatesErrorEventType = @"error";
NSString * const EXUpdatesUpdateAvailableEventType = @"updateAvailable";
NSString * const EXUpdatesNotAvailableEventType = @"noUpdateAvailable";

@interface EXUpdatesManager ()

@property (nonatomic, strong) EXAppLoader *manifestAppLoader;

@end

@implementation EXUpdatesManager

- (void)notifyApp:(EXKernelAppRecord *)appRecord
ofDownloadWithManifest:(EXManifestsManifest * _Nullable)manifest
            isNew:(BOOL)isBundleNew
            error:(NSError * _Nullable)error;
{
  NSDictionary *body;
  if (error) {
    body = @{
             @"type": EXUpdatesErrorEventType,
             @"message": error.localizedDescription
             };
  } else if (isBundleNew) {
    // prevent a crash, but this shouldn't ever happen
    NSDictionary *rawManifestJSON = manifest ? manifest.rawManifestJSON : @{};
    body = @{
             @"type": EXUpdatesUpdateAvailableEventType,
             @"manifest": rawManifestJSON
             };
  } else {
    body = @{
             @"type": EXUpdatesNotAvailableEventType
             };
  }
  RCTBridge *bridge = appRecord.appManager.reactBridge;
  if (appRecord.status == kEXKernelAppRecordStatusRunning) {
    [bridge enqueueJSCall:@"RCTDeviceEventEmitter.emit" args:@[EXUpdatesEventName, body]];
  }
}

# pragma mark - internal

- (EXAppLoader *)_appLoaderWithScopedModule:(id)scopedModule
{
  NSString *scopeKey = ((EXScopedBridgeModule *)scopedModule).scopeKey;
  return [self _appLoaderWithScopeKey:scopeKey];
}

- (EXAppLoader *)_appLoaderWithScopeKey:(NSString *)scopeKey
{
  EXKernelAppRecord *appRecord = [[EXKernel sharedInstance].appRegistry newestRecordWithScopeKey:scopeKey];
  return appRecord.appLoader;
}

# pragma mark - EXUpdatesBindingDelegate

- (EXUpdatesConfig *)configForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].config;
}

- (EXUpdatesSelectionPolicy *)selectionPolicyForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].selectionPolicy;
}

- (nullable EXUpdatesUpdate *)launchedUpdateForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].appLauncher.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMapForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].appLauncher.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssetsForScopeKey:(NSString *)scopeKey
{
  return NO;
}

- (BOOL)isStartedForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].appLauncher != nil;
}

- (BOOL)isEmergencyLaunchForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].isEmergencyLaunch;
}

- (void)requestRelaunchForScopeKey:(NSString *)scopeKey withCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion
{
  [[EXKernel sharedInstance] reloadAppFromCacheWithScopeKey:scopeKey];
  completion(YES);
}

# pragma mark - EXUpdatesScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedModule
{
  NSString *scopeKey = ((EXScopedBridgeModule *)scopedModule).scopeKey;
  [[EXKernel sharedInstance] reloadAppWithScopeKey:scopeKey];
}

- (void)updatesModuleDidSelectReloadFromCache:(id)scopedModule
{
  NSString *scopeKey = ((EXScopedBridgeModule *)scopedModule).scopeKey;
  [[EXKernel sharedInstance] reloadAppFromCacheWithScopeKey:scopeKey];
}

- (void)updatesModule:(id)scopedModule
didRequestManifestWithCacheBehavior:(EXManifestCacheBehavior)cacheBehavior
              success:(void (^)(EXManifestsManifest * _Nonnull))success
              failure:(void (^)(NSError * _Nonnull))failure
{
  if ([EXEnvironment sharedEnvironment].isDetached && ![EXEnvironment sharedEnvironment].areRemoteUpdatesEnabled) {
    failure(RCTErrorWithMessage(@"Remote updates are disabled in app.json"));
    return;
  }

  EXUpdatesDatabaseManager *databaseKernelService = [EXKernel sharedInstance].serviceRegistry.updatesDatabaseManager;
  EXAppLoader *appLoader = [self _appLoaderWithScopedModule:scopedModule];

  EXUpdatesFileDownloader *fileDownloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:appLoader.config];
  [fileDownloader downloadManifestFromURL:appLoader.config.updateUrl
                             withDatabase:databaseKernelService.database
                             extraHeaders:nil
                             successBlock:^(EXUpdatesUpdate *update) {
    success(update.manifest);
  } errorBlock:^(NSError *error) {
    failure(error);
  }];
}


- (void)updatesModule:(id)scopedModule
didRequestBundleWithCompletionQueue:(dispatch_queue_t)completionQueue
                start:(void (^)(void))startBlock
              success:(void (^)(EXManifestsManifest * _Nullable))success
              failure:(void (^)(NSError * _Nonnull))failure
{
  if ([EXEnvironment sharedEnvironment].isDetached && ![EXEnvironment sharedEnvironment].areRemoteUpdatesEnabled) {
    failure(RCTErrorWithMessage(@"Remote updates are disabled in app.json"));
    return;
  }

  EXUpdatesDatabaseManager *databaseKernelService = [EXKernel sharedInstance].serviceRegistry.updatesDatabaseManager;
  EXAppLoader *appLoader = [self _appLoaderWithScopedModule:scopedModule];

  EXUpdatesRemoteAppLoader *remoteAppLoader = [[EXUpdatesRemoteAppLoader alloc] initWithConfig:appLoader.config database:databaseKernelService.database directory:databaseKernelService.updatesDirectory completionQueue:completionQueue];
  [remoteAppLoader loadUpdateFromUrl:appLoader.config.updateUrl onManifest:^BOOL(EXUpdatesUpdate * _Nonnull update) {
    BOOL shouldLoad = [appLoader.selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:appLoader.appLauncher.launchedUpdate filters:update.manifestFilters];
    if (shouldLoad) {
      startBlock();
    }
    return shouldLoad;
  } asset:^(EXUpdatesAsset *asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    // do nothing for now
  } success:^(EXUpdatesUpdate * _Nullable update) {
    if (update) {
      success(update.manifest);
    } else {
      success(nil);
    }
  } error:^(NSError * _Nonnull error) {
    failure(error);
  }];
}

@end
