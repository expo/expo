// Copyright 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesModule.h>
#import <EXUpdates/EXUpdatesRemoteAppLoader.h>
#import <EXUpdates/EXUpdatesService.h>
#import <EXUpdates/EXUpdatesUpdate.h>

#if __has_include(<EXUpdates/EXUpdates-Swift.h>)
#import <EXUpdates/EXUpdates-Swift.h>
#else
#import "EXUpdates-Swift.h"
#endif

@interface EXUpdatesModule ()

@property (nonatomic, weak) id<EXUpdatesModuleInterface> updatesService;

@end

/**
 * Exported module which provides to the JS runtime information about the currently running update
 * and updates state, along with methods to check for and download new updates, reload with the
 * newest downloaded update applied, and read/clear native log entries.
 *
 * Communicates with the updates hub (EXUpdatesAppController in most apps, EXAppLoaderExpoUpdates in
 * Expo Go and legacy standalone apps) via EXUpdatesService, an internal module which is overridden
 * by EXUpdatesBinding, a scoped module, in Expo Go.
 */
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
      @"isEmbeddedLaunch": @(NO),
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
      @"isEmbeddedLaunch": @(NO),
      @"isMissingRuntimeVersion": isMissingRuntimeVersion,
      @"releaseChannel": releaseChannel,
      @"runtimeVersion": runtimeVersion,
      @"channel": channel
    };
  }

  long long commitTime = [@(floor([launchedUpdate.commitTime timeIntervalSince1970] * 1000)) longLongValue];
  
  return @{
    @"isEnabled": @(YES),
    @"isEmbeddedLaunch": @(_updatesService.isEmbeddedLaunch),
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
    extraHeaders = [EXUpdatesFileDownloader extraHeadersWithDatabase:self->_updatesService.database
                                                              config:self->_updatesService.config
                                                      launchedUpdate:self->_updatesService.launchedUpdate
                                                      embeddedUpdate:self->_updatesService.embeddedUpdate];
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

EX_EXPORT_METHOD_AS(readLogEntriesAsync,
                     readLogEntriesAsync:(NSNumber *)maxAge
                                 resolve:(EXPromiseResolveBlock)resolve
                                  reject:(EXPromiseRejectBlock)reject)
{
  EXUpdatesLogReader *reader = [EXUpdatesLogReader new];
  NSError *error = nil;
  // maxAge is in milliseconds, convert to seconds to compute NSDate
  NSTimeInterval age = [maxAge intValue] / 1000;
  NSDate *epoch = [NSDate dateWithTimeIntervalSinceNow:-age];
  NSArray<NSDictionary *> *entries = [reader getLogEntriesNewerThan:epoch error:&error];
  if (error != nil) {
    reject(@"ERR_UPDATES_READ_LOGS", [error localizedDescription], error);
  } else {
    resolve(entries);
  }
}

EX_EXPORT_METHOD_AS(clearLogEntriesAsync,
                     clearLogEntriesAsync:(EXPromiseResolveBlock)resolve
                                   reject:(EXPromiseRejectBlock)reject)
{
  EXUpdatesLogReader *reader = [EXUpdatesLogReader new];
  [reader purgeLogEntriesOlderThan:[NSDate date] completion:^(NSError *error) {
    if (error) {
      reject(@"ERR_UPDATES_READ_LOGS", [error localizedDescription], error);
    } else {
      resolve(nil);
    }
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

  EXUpdatesRemoteAppLoader *remoteAppLoader = [[EXUpdatesRemoteAppLoader alloc] initWithConfig:_updatesService.config database:_updatesService.database directory:_updatesService.directory launchedUpdate:_updatesService.launchedUpdate completionQueue:self.methodQueue];
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
