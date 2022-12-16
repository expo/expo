// Copyright 2019 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesConfig.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesDatabase.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesFileDownloader.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesModule.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesService.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesUpdate.h>

@interface ABI46_0_0EXUpdatesModule ()

@property (nonatomic, weak) id<ABI46_0_0EXUpdatesModuleInterface> updatesService;

@end

@implementation ABI46_0_0EXUpdatesModule

ABI46_0_0EX_EXPORT_MODULE(ExpoUpdates);

- (void)setModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry
{
  _updatesService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI46_0_0EXUpdatesModuleInterface)];
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
  ABI46_0_0EXUpdatesUpdate *launchedUpdate = _updatesService.launchedUpdate;
  if (!launchedUpdate) {
    return @{
      @"isEnabled": @(NO),
      @"isMissingRuntimeVersion": isMissingRuntimeVersion,
      @"releaseChannel": releaseChannel,
      @"runtimeVersion": runtimeVersion,
      @"channel": channel
    };
  }

  long long commitTime = [@(floor([launchedUpdate.commitTime timeIntervalSince1970] * 1000)) longLongValue];
  
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
    @"channel": channel,
    @"commitTime": @(commitTime)
  };
}

ABI46_0_0EX_EXPORT_METHOD_AS(reload,
                    reloadAsync:(ABI46_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot reload when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.canRelaunch) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot use this method. Otherwise, make sure you have called [[ABI46_0_0EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  [_updatesService requestRelaunchWithCompletion:^(BOOL success) {
    if (success) {
      resolve(nil);
    } else {
      reject(@"ERR_UPDATES_RELOAD", @"Could not reload application. Ensure you have set the `bridge` property of ABI46_0_0EXUpdatesAppController.", nil);
    }
  }];
}

ABI46_0_0EX_EXPORT_METHOD_AS(checkForUpdateAsync,
                    checkForUpdateAsync:(ABI46_0_0EXPromiseResolveBlock)resolve
                                 reject:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot check for updates when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot check for updates. Otherwise, make sure you have called [[ABI46_0_0EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  __block NSDictionary *extraHeaders;
  dispatch_sync(_updatesService.database.databaseQueue, ^{
    extraHeaders = [ABI46_0_0EXUpdatesFileDownloader extraHeadersWithDatabase:self->_updatesService.database
                                                              config:self->_updatesService.config
                                                      launchedUpdate:self->_updatesService.launchedUpdate
                                                      embeddedUpdate:self->_updatesService.embeddedUpdate];
  });

  ABI46_0_0EXUpdatesFileDownloader *fileDownloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:_updatesService.config];
  [fileDownloader downloadManifestFromURL:_updatesService.config.updateUrl
                             withDatabase:_updatesService.database
                             extraHeaders:extraHeaders
                             successBlock:^(ABI46_0_0EXUpdatesUpdate *update) {
    ABI46_0_0EXUpdatesUpdate *launchedUpdate = self->_updatesService.launchedUpdate;
    ABI46_0_0EXUpdatesSelectionPolicy *selectionPolicy = self->_updatesService.selectionPolicy;
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

ABI46_0_0EX_EXPORT_METHOD_AS(fetchUpdateAsync,
                    fetchUpdateAsync:(ABI46_0_0EXPromiseResolveBlock)resolve
                              reject:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot fetch updates when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot fetch updates. Otherwise, make sure you have called [[ABI46_0_0EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  ABI46_0_0EXUpdatesRemoteAppLoader *remoteAppLoader = [[ABI46_0_0EXUpdatesRemoteAppLoader alloc] initWithConfig:_updatesService.config database:_updatesService.database directory:_updatesService.directory launchedUpdate:_updatesService.launchedUpdate completionQueue:self.methodQueue];
  [remoteAppLoader loadUpdateFromUrl:_updatesService.config.updateUrl onManifest:^BOOL(ABI46_0_0EXUpdatesUpdate * _Nonnull update) {
    return [self->_updatesService.selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:self->_updatesService.launchedUpdate filters:update.manifestFilters];
  } asset:^(ABI46_0_0EXUpdatesAsset *asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    // do nothing for now
  } success:^(ABI46_0_0EXUpdatesUpdate * _Nullable update) {
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
