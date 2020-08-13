// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppLoader+Updates.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelAppRecord.h"
#import "EXReactAppManager.h"
#import "EXScopedModuleRegistry.h"
#import "EXUpdates.h"
#import "EXUpdatesDatabaseManager.h"
#import "EXUpdatesManager.h"

#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesRemoteAppLoader.h>

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

NSString * const EXUpdatesEventNameNew = @"Expo.nativeUpdatesEvent";
NSString * const EXUpdatesUpdateAvailableEventType = @"updateAvailable";

@interface EXUpdatesManager ()

@property (nonatomic, strong) EXAppLoader *manifestAppLoader;

@end

@implementation EXUpdatesManager

- (void)notifyApp:(EXKernelAppRecord *)appRecord
ofDownloadWithManifest:(NSDictionary * _Nullable)manifest
            isNew:(BOOL)isBundleNew
            error:(NSError * _Nullable)error;
{
  NSDictionary *body;
  NSDictionary *bodyLegacy;
  if (error) {
    body = @{
             @"type": EXUpdatesErrorEventType,
             @"message": error.localizedDescription
             };
  } else if (isBundleNew) {
    if (!manifest) {
      // prevent a crash, but this shouldn't ever happen
      manifest = @{};
    }
    bodyLegacy = @{
                   @"type": EXUpdatesDownloadFinishedEventType,
                   @"manifest": manifest
                   };
    body = @{
             @"type": EXUpdatesUpdateAvailableEventType,
             @"manifest": manifest
             };
  } else {
    body = @{
             @"type": EXUpdatesNotAvailableEventType
             };
  }
  RCTBridge *bridge = appRecord.appManager.reactBridge;
  if (appRecord.status == kEXKernelAppRecordStatusRunning) {
    // for SDK 38 and below
    if ([self _doesBridgeSupportUpdatesModule:bridge]) {
      [bridge.scopedModules.updates sendEventWithBody:bodyLegacy ?: body];
    }
    // for SDK 39+
    [bridge enqueueJSCall:@"RCTDeviceEventEmitter.emit" args:@[EXUpdatesEventNameNew, body]];
  }
}

# pragma mark - internal

- (EXAppLoader *)_appLoaderWithScopedModule:(id)scopedModule
{
  NSString *experienceId = ((EXScopedBridgeModule *)scopedModule).experienceId;
  return [self _appLoaderWithExperienceId:experienceId];
}

- (EXAppLoader *)_appLoaderWithExperienceId:(NSString *)experienceId
{
  EXKernelAppRecord *appRecord = [[EXKernel sharedInstance].appRegistry newestRecordWithExperienceId:experienceId];
  return appRecord.appLoader;
}

# pragma mark - EXUpdatesBindingDelegate

- (EXUpdatesConfig *)configForExperienceId:(NSString *)experienceId
{
  return [self _appLoaderWithExperienceId:experienceId].config;
}

- (id<EXUpdatesSelectionPolicy>)selectionPolicyForExperienceId:(NSString *)experienceId
{
  return [self _appLoaderWithExperienceId:experienceId].selectionPolicy;
}

- (nullable EXUpdatesUpdate *)launchedUpdateForExperienceId:(NSString *)experienceId
{
  return [self _appLoaderWithExperienceId:experienceId].appLauncher.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMapForExperienceId:(NSString *)experienceId
{
  return [self _appLoaderWithExperienceId:experienceId].appLauncher.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssetsForExperienceId:(NSString *)experienceId
{
  return NO;
}

- (BOOL)isStartedForExperienceId:(NSString *)experienceId
{
  return [self _appLoaderWithExperienceId:experienceId].appLauncher != nil;
}

- (BOOL)isEmergencyLaunchForExperienceId:(NSString *)experienceId
{
  return NO;
}

- (void)requestRelaunchForExperienceId:(NSString *)experienceId withCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion
{
  [[EXKernel sharedInstance] reloadAppFromCacheWithExperienceId:experienceId];
  completion(YES);
}

# pragma mark - EXUpdatesScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedModule
{
  NSString *experienceId = ((EXScopedBridgeModule *)scopedModule).experienceId;
  [[EXKernel sharedInstance] reloadAppWithExperienceId:experienceId];
}

- (void)updatesModuleDidSelectReloadFromCache:(id)scopedModule
{
  NSString *experienceId = ((EXScopedBridgeModule *)scopedModule).experienceId;
  [[EXKernel sharedInstance] reloadAppFromCacheWithExperienceId:experienceId];
}

- (void)updatesModule:(id)scopedModule
didRequestManifestWithCacheBehavior:(EXManifestCacheBehavior)cacheBehavior
              success:(void (^)(NSDictionary * _Nonnull))success
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
                           cacheDirectory:databaseKernelService.updatesDirectory
                             successBlock:^(EXUpdatesUpdate *update) {
    success(update.rawManifest);
  } errorBlock:^(NSError *error, NSURLResponse *response) {
    failure(error);
  }];
}

- (void)updatesModule:(nonnull id)scopedModule didRequestBundleWithManifest:(nonnull NSDictionary *)manifest progress:(nonnull void (^)(NSDictionary * _Nonnull))progress success:(nonnull void (^)(NSData * _Nonnull))success failure:(nonnull void (^)(NSError * _Nonnull))failure {
  // TODO: remove this stub
}


- (void)updatesModule:(id)scopedModule
didRequestBundleWithCompletionQueue:(dispatch_queue_t)completionQueue
                start:(void (^)(void))startBlock
              success:(void (^)(NSDictionary * _Nullable))success
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
    BOOL shouldLoad = [appLoader.selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:appLoader.appLauncher.launchedUpdate];
    if (shouldLoad) {
      startBlock();
    }
    return shouldLoad;
  } success:^(EXUpdatesUpdate * _Nullable update) {
    if (update) {
      success(update.rawManifest);
    } else {
      success(nil);
    }
  } error:^(NSError * _Nonnull error) {
    failure(error);
  }];
}

- (BOOL)_doesBridgeSupportUpdatesModule:(RCTBridge *)bridge
{
  // sdk versions prior to 26 didn't include this module.
  return ([bridge.scopedModules respondsToSelector:@selector(updates)]);
}

@end
