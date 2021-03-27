// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppLoader+Sync.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelAppRecord.h"
#import "EXReactAppManager.h"
#import "EXScopedModuleRegistry.h"
#import "EXSyncDatabaseManager.h"
#import "EXSyncManager.h"

#import <EXUpdates/EXSyncFileDownloader.h>
#import <EXUpdates/EXSyncRemoteLoader.h>

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

NSString * const EXSyncEventName = @"Expo.nativeUpdatesEvent";
NSString * const EXSyncErrorEventType = @"error";
NSString * const EXSyncManifestAvailableEventType = @"updateAvailable";
NSString * const EXSyncNotAvailableEventType = @"noUpdateAvailable";

// legacy events
// TODO: remove once SDK 38 is phased out
NSString * const EXSyncEventNameLegacy = @"Exponent.nativeUpdatesEvent";
NSString * const EXSyncDownloadStartEventType = @"downloadStart";
NSString * const EXSyncDownloadProgressEventType = @"downloadProgress";
NSString * const EXSyncDownloadFinishedEventType = @"downloadFinished";

@interface EXSyncManager ()

@property (nonatomic, strong) EXAppLoader *manifestAppLoader;

@end

@implementation EXSyncManager

- (void)notifyApp:(EXKernelAppRecord *)appRecord
ofDownloadWithManifest:(NSDictionary * _Nullable)manifest
            isNew:(BOOL)isBundleNew
            error:(NSError * _Nullable)error;
{
  NSDictionary *body;
  NSDictionary *bodyLegacy;
  if (error) {
    body = @{
             @"type": EXSyncErrorEventType,
             @"message": error.localizedDescription
             };
  } else if (isBundleNew) {
    if (!manifest) {
      // prevent a crash, but this shouldn't ever happen
      manifest = @{};
    }
    bodyLegacy = @{
                   @"type": EXSyncDownloadFinishedEventType,
                   @"manifest": manifest
                   };
    body = @{
             @"type": EXSyncManifestAvailableEventType,
             @"manifest": manifest
             };
  } else {
    body = @{
             @"type": EXSyncNotAvailableEventType
             };
  }
  RCTBridge *bridge = appRecord.appManager.reactBridge;
  if (appRecord.status == kEXKernelAppRecordStatusRunning) {
    // for SDK 38 and below
    [bridge enqueueJSCall:@"RCTDeviceEventEmitter.emit" args:@[EXSyncEventNameLegacy, bodyLegacy ?: body]];
    // for SDK 39+
    [bridge enqueueJSCall:@"RCTDeviceEventEmitter.emit" args:@[EXSyncEventName, body]];
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

# pragma mark - EXSyncBindingDelegate

- (EXSyncConfig *)configForExperienceId:(NSString *)experienceId
{
  return [self _appLoaderWithExperienceId:experienceId].config;
}

- (id<EXSyncSelectionPolicy>)selectionPolicyForExperienceId:(NSString *)experienceId
{
  return [self _appLoaderWithExperienceId:experienceId].selectionPolicy;
}

- (nullable EXSyncManifest *)launchedUpdateForExperienceId:(NSString *)experienceId
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
  return [self _appLoaderWithExperienceId:experienceId].isEmergencyLaunch;
}

- (void)requestRelaunchForExperienceId:(NSString *)experienceId withCompletion:(EXSyncRelaunchCompletionBlock)completion
{
  [[EXKernel sharedInstance] reloadAppFromCacheWithExperienceId:experienceId];
  completion(YES);
}

# pragma mark - EXSyncScopedModuleDelegate

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

  EXSyncDatabaseManager *databaseKernelService = [EXKernel sharedInstance].serviceRegistry.updatesDatabaseManager;
  EXAppLoader *appLoader = [self _appLoaderWithScopedModule:scopedModule];

  EXSyncFileDownloader *fileDownloader = [[EXSyncFileDownloader alloc] initWithUpdatesConfig:appLoader.config];
  [fileDownloader downloadManifestFromURL:appLoader.config.updateUrl
                             withDatabase:databaseKernelService.database
                             extraHeaders:nil
                             successBlock:^(EXSyncManifest *update) {
    success(update.rawManifest);
  } errorBlock:^(NSError *error, NSURLResponse *response) {
    failure(error);
  }];
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

  EXSyncDatabaseManager *databaseKernelService = [EXKernel sharedInstance].serviceRegistry.updatesDatabaseManager;
  EXAppLoader *appLoader = [self _appLoaderWithScopedModule:scopedModule];

  EXSyncRemoteLoader *remoteAppLoader = [[EXSyncRemoteLoader alloc] initWithConfig:appLoader.config database:databaseKernelService.database directory:databaseKernelService.updatesDirectory completionQueue:completionQueue];
  [remoteAppLoader loadUpdateFromUrl:appLoader.config.updateUrl onManifest:^BOOL(EXSyncManifest * _Nonnull update) {
    BOOL shouldLoad = [appLoader.selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:appLoader.appLauncher.launchedUpdate filters:update.manifestFilters];
    if (shouldLoad) {
      startBlock();
    }
    return shouldLoad;
  } success:^(EXSyncManifest * _Nullable update) {
    if (update) {
      success(update.rawManifest);
    } else {
      success(nil);
    }
  } error:^(NSError * _Nonnull error) {
    failure(error);
  }];
}

@end
