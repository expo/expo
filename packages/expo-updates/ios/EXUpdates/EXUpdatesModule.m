// Copyright 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesModule.h>
#import <EXUpdates/EXUpdatesRemoteAppLoader.h>
#import <EXUpdates/EXUpdatesService.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@interface EXUpdatesModule ()

@property (nonatomic, weak) id<EXUpdatesModuleInterface> updatesService;

@end

@implementation EXUpdatesModule

EX_EXPORT_MODULE(ExpoUpdates);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _updatesService = [moduleRegistry getModuleImplementingProtocol:@protocol(EXUpdatesModuleInterface)];
}

- (NSDictionary *)constantsToExport
{
  NSString *releaseChannel = _updatesService.config.releaseChannel;
  NSString *channel = _updatesService.config.requestHeaders[@"expo-channel-name"] ?: @"";
  NSString *runtimeVersion = _updatesService.config.runtimeVersion ?: @"";
  NSNumber *isMissingRuntimeVersion = @(_updatesService.config.isMissingRuntimeVersion);
  
  if (!_updatesService.isStarted) {
    return @{
      @"isEnabled": @(NO),
      @"isMissingRuntimeVersion": isMissingRuntimeVersion,
      @"releaseChannel": releaseChannel,
      @"runtimeVersion": runtimeVersion,
      @"channel": channel
    };
  }
  EXUpdatesUpdate *launchedUpdate = _updatesService.launchedUpdate;
  if (!launchedUpdate) {
    return @{
      @"isEnabled": @(NO),
      @"isMissingRuntimeVersion": isMissingRuntimeVersion,
      @"releaseChannel": releaseChannel,
      @"runtimeVersion": runtimeVersion,
      @"channel": channel
    };
  }
  
  return @{
    @"isEnabled": @(YES),
    @"isUsingEmbeddedAssets": @(_updatesService.isUsingEmbeddedAssets),
    @"updateId": launchedUpdate.updateId.UUIDString ?: @"",
    @"manifest": launchedUpdate.manifest.rawManifestJSON ?: @{},
    @"localAssets": _updatesService.assetFilesMap ?: @{},
    @"isEmergencyLaunch": @(_updatesService.isEmergencyLaunch),
    @"isMissingRuntimeVersion": isMissingRuntimeVersion,
    @"releaseChannel": releaseChannel,
    @"runtimeVersion": runtimeVersion,
    @"channel": channel
  };
}

EX_EXPORT_METHOD_AS(reload,
                    reloadAsync:(EXPromiseResolveBlock)resolve
                         reject:(EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot reload when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.canRelaunch) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot use this method. Otherwise, make sure you have called [[EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  [_updatesService requestRelaunchWithCompletion:^(BOOL success) {
    if (success) {
      resolve(nil);
    } else {
      reject(@"ERR_UPDATES_RELOAD", @"Could not reload application. Ensure you have set the `bridge` property of EXUpdatesAppController.", nil);
    }
  }];
}

EX_EXPORT_METHOD_AS(checkForUpdateAsync,
                    checkForUpdateAsync:(EXPromiseResolveBlock)resolve
                                 reject:(EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot check for updates when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot check for updates. Otherwise, make sure you have called [[EXUpdatesAppController sharedInstance] start].", nil);
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

  EXUpdatesFileDownloader *fileDownloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:_updatesService.config];
  [fileDownloader downloadManifestFromURL:_updatesService.config.updateUrl
                             withDatabase:_updatesService.database
                             extraHeaders:extraHeaders
                             successBlock:^(EXUpdatesUpdate *update) {
    EXUpdatesUpdate *launchedUpdate = self->_updatesService.launchedUpdate;
    EXUpdatesSelectionPolicy *selectionPolicy = self->_updatesService.selectionPolicy;
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
  } errorBlock:^(NSError *error) {
    reject(@"ERR_UPDATES_CHECK", error.localizedDescription, error);
  }];
}

EX_EXPORT_METHOD_AS(fetchUpdateAsync,
                    fetchUpdateAsync:(EXPromiseResolveBlock)resolve
                              reject:(EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot fetch updates when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot fetch updates. Otherwise, make sure you have called [[EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  EXUpdatesRemoteAppLoader *remoteAppLoader = [[EXUpdatesRemoteAppLoader alloc] initWithConfig:_updatesService.config database:_updatesService.database directory:_updatesService.directory completionQueue:self.methodQueue];
  [remoteAppLoader loadUpdateFromUrl:_updatesService.config.updateUrl onManifest:^BOOL(EXUpdatesUpdate * _Nonnull update) {
    return [self->_updatesService.selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:self->_updatesService.launchedUpdate filters:update.manifestFilters];
  } asset:^(EXUpdatesAsset *asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    // do nothing for now
  } success:^(EXUpdatesUpdate * _Nullable update) {
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
