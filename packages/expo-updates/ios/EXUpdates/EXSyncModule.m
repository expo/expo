// Copyright 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncConfig.h>
#import <EXUpdates/EXSyncDatabase.h>
#import <EXUpdates/EXSyncFileDownloader.h>
#import <EXUpdates/EXSyncModule.h>
#import <EXUpdates/EXSyncRemoteLoader.h>
#import <EXUpdates/EXSyncService.h>
#import <EXUpdates/EXSyncManifest.h>

@interface EXSyncModule ()

@property (nonatomic, weak) id<EXSyncInterface> updatesService;

@end

@implementation EXSyncModule

UM_EXPORT_MODULE(ExpoUpdates);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _updatesService = [moduleRegistry getModuleImplementingProtocol:@protocol(EXSyncInterface)];
}

- (NSDictionary *)constantsToExport
{
  if (!_updatesService.isStarted) {
    return @{
      @"isEnabled": @(NO),
      @"isMissingRuntimeVersion": @(_updatesService.config.isMissingRuntimeVersion)
    };
  }
  EXSyncManifest *launchedUpdate = _updatesService.launchedUpdate;
  if (!launchedUpdate) {
    return @{
      @"isEnabled": @(NO),
      @"isMissingRuntimeVersion": @(_updatesService.config.isMissingRuntimeVersion)
    };
  } else {
    return @{
      @"isEnabled": @(YES),
      @"isUsingEmbeddedAssets": @(_updatesService.isUsingEmbeddedAssets),
      @"updateId": launchedUpdate.updateId.UUIDString ?: @"",
      @"manifest": launchedUpdate.rawManifest ?: @{},
      @"releaseChannel": _updatesService.config.releaseChannel,
      @"localAssets": _updatesService.assetFilesMap ?: @{},
      @"isEmergencyLaunch": @(_updatesService.isEmergencyLaunch),
      @"isMissingRuntimeVersion": @(_updatesService.config.isMissingRuntimeVersion)
    };
  }
  
}

UM_EXPORT_METHOD_AS(reload,
                    reloadAsync:(UMPromiseResolveBlock)resolve
                         reject:(UMPromiseRejectBlock)reject)
{
  if (!_updatesService.canRelaunch) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot use this method. Otherwise, make sure you have called [[EXSyncController sharedInstance] start].", nil);
    return;
  }

  [_updatesService requestRelaunchWithCompletion:^(BOOL success) {
    if (success) {
      resolve(nil);
    } else {
      reject(@"ERR_UPDATES_RELOAD", @"Could not reload application. Ensure you have set the `bridge` property of EXSyncController.", nil);
    }
  }];
}

UM_EXPORT_METHOD_AS(checkForUpdateAsync,
                    checkForUpdateAsync:(UMPromiseResolveBlock)resolve
                                 reject:(UMPromiseRejectBlock)reject)
{
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot check for updates. Otherwise, make sure you have called [[EXSyncController sharedInstance] start].", nil);
    return;
  }

  __block NSDictionary *extraHeaders;
  dispatch_sync(_updatesService.database.databaseQueue, ^{
    NSError *error;
    extraHeaders = [self->_updatesService.database serverDefinedHeadersWithScopeKey:self->_updatesService.config.scopeKey error:&error];
    if (error) {
      NSLog(@"Error selecting serverDefinedHeaders from database: %@", error.localizedDescription);
    }
  });

  EXSyncFileDownloader *fileDownloader = [[EXSyncFileDownloader alloc] initWithUpdatesConfig:_updatesService.config];
  [fileDownloader downloadManifestFromURL:_updatesService.config.updateUrl
                             withDatabase:_updatesService.database
                             extraHeaders:extraHeaders
                             successBlock:^(EXSyncManifest *update) {
    EXSyncManifest *launchedUpdate = self->_updatesService.launchedUpdate;
    id<EXSyncSelectionPolicy> selectionPolicy = self->_updatesService.selectionPolicy;
    if ([selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:launchedUpdate filters:update.manifestFilters]) {
      resolve(@{
        @"isAvailable": @(YES),
        @"manifest": update.rawManifest
      });
    } else {
      resolve(@{
        @"isAvailable": @(NO)
      });
    }
  } errorBlock:^(NSError *error, NSURLResponse *response) {
    reject(@"ERR_UPDATES_CHECK", error.localizedDescription, error);
  }];
}

UM_EXPORT_METHOD_AS(fetchUpdateAsync,
                    fetchUpdateAsync:(UMPromiseResolveBlock)resolve
                              reject:(UMPromiseRejectBlock)reject)
{
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot fetch updates. Otherwise, make sure you have called [[EXSyncController sharedInstance] start].", nil);
    return;
  }

  EXSyncRemoteLoader *remoteAppLoader = [[EXSyncRemoteLoader alloc] initWithConfig:_updatesService.config database:_updatesService.database directory:_updatesService.directory completionQueue:self.methodQueue];
  [remoteAppLoader loadUpdateFromUrl:_updatesService.config.updateUrl onManifest:^BOOL(EXSyncManifest * _Nonnull update) {
    return [self->_updatesService.selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:self->_updatesService.launchedUpdate filters:update.manifestFilters];
  } success:^(EXSyncManifest * _Nullable update) {
    if (update) {
      resolve(@{
        @"isNew": @(YES),
        @"manifest": update.rawManifest
      });
    } else {
      resolve(@{
        @"isNew": @(NO)
      });
    }
  } error:^(NSError * _Nonnull error) {
    reject(@"ERR_UPDATES_FETCH", @"Failed to download new update", error);
  }];
}

@end
