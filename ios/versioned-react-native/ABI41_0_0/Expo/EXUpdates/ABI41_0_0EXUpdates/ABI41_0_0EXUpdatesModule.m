// Copyright 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesFileDownloader.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesModule.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesService.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate.h>

@interface ABI41_0_0EXUpdatesModule ()

@property (nonatomic, weak) id<ABI41_0_0EXUpdatesInterface> updatesService;

@end

@implementation ABI41_0_0EXUpdatesModule

ABI41_0_0UM_EXPORT_MODULE(ExpoUpdates);

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _updatesService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0EXUpdatesInterface)];
}

- (NSDictionary *)constantsToExport
{
  if (!_updatesService.isStarted) {
    return @{
      @"isEnabled": @(NO),
      @"isMissingRuntimeVersion": @(_updatesService.config.isMissingRuntimeVersion)
    };
  }
  ABI41_0_0EXUpdatesUpdate *launchedUpdate = _updatesService.launchedUpdate;
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

ABI41_0_0UM_EXPORT_METHOD_AS(reload,
                    reloadAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                         reject:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  if (!_updatesService.canRelaunch) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot use this method. Otherwise, make sure you have called [[ABI41_0_0EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  [_updatesService requestRelaunchWithCompletion:^(BOOL success) {
    if (success) {
      resolve(nil);
    } else {
      reject(@"ERR_UPDATES_RELOAD", @"Could not reload application. Ensure you have set the `bridge` property of ABI41_0_0EXUpdatesAppController.", nil);
    }
  }];
}

ABI41_0_0UM_EXPORT_METHOD_AS(checkForUpdateAsync,
                    checkForUpdateAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                                 reject:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot check for updates. Otherwise, make sure you have called [[ABI41_0_0EXUpdatesAppController sharedInstance] start].", nil);
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

  ABI41_0_0EXUpdatesFileDownloader *fileDownloader = [[ABI41_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:_updatesService.config];
  [fileDownloader downloadManifestFromURL:_updatesService.config.updateUrl
                             withDatabase:_updatesService.database
                             extraHeaders:extraHeaders
                             successBlock:^(ABI41_0_0EXUpdatesUpdate *update) {
    ABI41_0_0EXUpdatesUpdate *launchedUpdate = self->_updatesService.launchedUpdate;
    id<ABI41_0_0EXUpdatesSelectionPolicy> selectionPolicy = self->_updatesService.selectionPolicy;
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

ABI41_0_0UM_EXPORT_METHOD_AS(fetchUpdateAsync,
                    fetchUpdateAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                              reject:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot fetch updates. Otherwise, make sure you have called [[ABI41_0_0EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  ABI41_0_0EXUpdatesRemoteAppLoader *remoteAppLoader = [[ABI41_0_0EXUpdatesRemoteAppLoader alloc] initWithConfig:_updatesService.config database:_updatesService.database directory:_updatesService.directory completionQueue:self.methodQueue];
  [remoteAppLoader loadUpdateFromUrl:_updatesService.config.updateUrl onManifest:^BOOL(ABI41_0_0EXUpdatesUpdate * _Nonnull update) {
    return [self->_updatesService.selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:self->_updatesService.launchedUpdate filters:update.manifestFilters];
  } success:^(ABI41_0_0EXUpdatesUpdate * _Nullable update) {
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
