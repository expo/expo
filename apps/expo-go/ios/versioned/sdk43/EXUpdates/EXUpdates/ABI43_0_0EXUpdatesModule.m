// Copyright 2019 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesConfig.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesDatabase.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesFileDownloader.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesModule.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesService.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesUpdate.h>

@interface ABI43_0_0EXUpdatesModule ()

@property (nonatomic, weak) id<ABI43_0_0EXUpdatesModuleInterface> updatesService;

@end

@implementation ABI43_0_0EXUpdatesModule

ABI43_0_0EX_EXPORT_MODULE(ExpoUpdates);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _updatesService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXUpdatesModuleInterface)];
}

- (NSDictionary *)constantsToExport
{
  if (!_updatesService.isStarted) {
    return @{
      @"isEnabled": @(NO),
      @"isMissingRuntimeVersion": @(_updatesService.config.isMissingRuntimeVersion)
    };
  }
  ABI43_0_0EXUpdatesUpdate *launchedUpdate = _updatesService.launchedUpdate;
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
      @"manifest": launchedUpdate.manifest.rawManifestJSON ?: @{},
      @"releaseChannel": _updatesService.config.releaseChannel,
      @"localAssets": _updatesService.assetFilesMap ?: @{},
      @"isEmergencyLaunch": @(_updatesService.isEmergencyLaunch),
      @"isMissingRuntimeVersion": @(_updatesService.config.isMissingRuntimeVersion)
    };
  }
  
}

ABI43_0_0EX_EXPORT_METHOD_AS(reload,
                    reloadAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot reload when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.canRelaunch) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot use this method. Otherwise, make sure you have called [[ABI43_0_0EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  [_updatesService requestRelaunchWithCompletion:^(BOOL success) {
    if (success) {
      resolve(nil);
    } else {
      reject(@"ERR_UPDATES_RELOAD", @"Could not reload application. Ensure you have set the `bridge` property of ABI43_0_0EXUpdatesAppController.", nil);
    }
  }];
}

ABI43_0_0EX_EXPORT_METHOD_AS(checkForUpdateAsync,
                    checkForUpdateAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                                 reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot check for updates when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot check for updates. Otherwise, make sure you have called [[ABI43_0_0EXUpdatesAppController sharedInstance] start].", nil);
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

  ABI43_0_0EXUpdatesFileDownloader *fileDownloader = [[ABI43_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:_updatesService.config];
  [fileDownloader downloadManifestFromURL:_updatesService.config.updateUrl
                             withDatabase:_updatesService.database
                             extraHeaders:extraHeaders
                             successBlock:^(ABI43_0_0EXUpdatesUpdate *update) {
    ABI43_0_0EXUpdatesUpdate *launchedUpdate = self->_updatesService.launchedUpdate;
    ABI43_0_0EXUpdatesSelectionPolicy *selectionPolicy = self->_updatesService.selectionPolicy;
    if ([selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:launchedUpdate filters:update.manifestFilters]) {
      resolve(@{
        @"isAvailable": @(YES),
        @"manifest": update.manifest.rawManifestJSON
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

ABI43_0_0EX_EXPORT_METHOD_AS(fetchUpdateAsync,
                    fetchUpdateAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                              reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot fetch updates when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot fetch updates. Otherwise, make sure you have called [[ABI43_0_0EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  ABI43_0_0EXUpdatesRemoteAppLoader *remoteAppLoader = [[ABI43_0_0EXUpdatesRemoteAppLoader alloc] initWithConfig:_updatesService.config database:_updatesService.database directory:_updatesService.directory completionQueue:self.methodQueue];
  [remoteAppLoader loadUpdateFromUrl:_updatesService.config.updateUrl onManifest:^BOOL(ABI43_0_0EXUpdatesUpdate * _Nonnull update) {
    return [self->_updatesService.selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:self->_updatesService.launchedUpdate filters:update.manifestFilters];
  } asset:^(ABI43_0_0EXUpdatesAsset *asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    // do nothing for now
  } success:^(ABI43_0_0EXUpdatesUpdate * _Nullable update) {
    if (update) {
      [self->_updatesService resetSelectionPolicy];
      resolve(@{
        @"isNew": @(YES),
        @"manifest": update.manifest.rawManifestJSON
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
