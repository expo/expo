// Copyright 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesConfig.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesDatabase.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesFileDownloader.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesModule.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesRemoteAppLoader.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesService.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>

#if __has_include(<ABI48_0_0EXUpdates/ABI48_0_0EXUpdates-Swift.h>)
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdates-Swift.h>
#else
#import "ABI48_0_0EXUpdates-Swift.h"
#endif

@interface ABI48_0_0EXUpdatesModule ()

@property (nonatomic, weak) id<ABI48_0_0EXUpdatesModuleInterface> updatesService;

@end

/**
 * Exported module which provides to the JS runtime information about the currently running update
 * and updates state, along with methods to check for and download new updates, reload with the
 * newest downloaded update applied, and read/clear native log entries.
 *
 * Communicates with the updates hub (ABI48_0_0EXUpdatesAppController in most apps, ABI48_0_0EXAppLoaderExpoUpdates in
 * Expo Go and legacy standalone apps) via ABI48_0_0EXUpdatesService, an internal module which is overridden
 * by ABI48_0_0EXUpdatesBinding, a scoped module, in Expo Go.
 */
@implementation ABI48_0_0EXUpdatesModule

ABI48_0_0EX_EXPORT_MODULE(ExpoUpdates);

- (void)setModuleRegistry:(ABI48_0_0EXModuleRegistry *)moduleRegistry
{
  _updatesService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI48_0_0EXUpdatesModuleInterface)];
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
  ABI48_0_0EXUpdatesUpdate *launchedUpdate = _updatesService.launchedUpdate;
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

ABI48_0_0EX_EXPORT_METHOD_AS(reload,
                    reloadAsync:(ABI48_0_0EXPromiseResolveBlock)resolve
                         reject:(ABI48_0_0EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot reload when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.canRelaunch) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot use this method. Otherwise, make sure you have called [[ABI48_0_0EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  [_updatesService requestRelaunchWithCompletion:^(BOOL success) {
    if (success) {
      resolve(nil);
    } else {
      reject(@"ERR_UPDATES_RELOAD", @"Could not reload application. Ensure you have set the `bridge` property of ABI48_0_0EXUpdatesAppController.", nil);
    }
  }];
}

ABI48_0_0EX_EXPORT_METHOD_AS(checkForUpdateAsync,
                    checkForUpdateAsync:(ABI48_0_0EXPromiseResolveBlock)resolve
                                 reject:(ABI48_0_0EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot check for updates when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot check for updates. Otherwise, make sure you have called [[ABI48_0_0EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  __block NSDictionary *extraHeaders;
  dispatch_sync(_updatesService.database.databaseQueue, ^{
    extraHeaders = [ABI48_0_0EXUpdatesFileDownloader extraHeadersWithDatabase:self->_updatesService.database
                                                              config:self->_updatesService.config
                                                      launchedUpdate:self->_updatesService.launchedUpdate
                                                      embeddedUpdate:self->_updatesService.embeddedUpdate];
  });

  ABI48_0_0EXUpdatesFileDownloader *fileDownloader = [[ABI48_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:_updatesService.config];
  [fileDownloader downloadManifestFromURL:_updatesService.config.updateUrl
                             withDatabase:_updatesService.database
                             extraHeaders:extraHeaders
                             successBlock:^(ABI48_0_0EXUpdatesUpdate *update) {
    ABI48_0_0EXUpdatesUpdate *launchedUpdate = self->_updatesService.launchedUpdate;
    ABI48_0_0EXUpdatesSelectionPolicy *selectionPolicy = self->_updatesService.selectionPolicy;
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

ABI48_0_0EX_EXPORT_METHOD_AS(readLogEntriesAsync,
                     readLogEntriesAsync:(NSNumber *)maxAge
                                 resolve:(ABI48_0_0EXPromiseResolveBlock)resolve
                                  reject:(ABI48_0_0EXPromiseRejectBlock)reject)
{
  ABI48_0_0EXUpdatesLogReader *reader = [ABI48_0_0EXUpdatesLogReader new];
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

ABI48_0_0EX_EXPORT_METHOD_AS(clearLogEntriesAsync,
                     clearLogEntriesAsync:(ABI48_0_0EXPromiseResolveBlock)resolve
                                   reject:(ABI48_0_0EXPromiseRejectBlock)reject)
{
  ABI48_0_0EXUpdatesLogReader *reader = [ABI48_0_0EXUpdatesLogReader new];
  [reader purgeLogEntriesOlderThan:[NSDate date] completion:^(NSError *error) {
    if (error) {
      reject(@"ERR_UPDATES_READ_LOGS", [error localizedDescription], error);
    } else {
      resolve(nil);
    }
  }];
}

ABI48_0_0EX_EXPORT_METHOD_AS(fetchUpdateAsync,
                    fetchUpdateAsync:(ABI48_0_0EXPromiseResolveBlock)resolve
                              reject:(ABI48_0_0EXPromiseRejectBlock)reject)
{
  if (!_updatesService.config.isEnabled) {
    reject(@"ERR_UPDATES_DISABLED", @"You cannot fetch updates when expo-updates is not enabled.", nil);
    return;
  }
  if (!_updatesService.isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot fetch updates. Otherwise, make sure you have called [[ABI48_0_0EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  ABI48_0_0EXUpdatesRemoteAppLoader *remoteAppLoader = [[ABI48_0_0EXUpdatesRemoteAppLoader alloc] initWithConfig:_updatesService.config database:_updatesService.database directory:_updatesService.directory launchedUpdate:_updatesService.launchedUpdate completionQueue:self.methodQueue];
  [remoteAppLoader loadUpdateFromUrl:_updatesService.config.updateUrl onManifest:^BOOL(ABI48_0_0EXUpdatesUpdate * _Nonnull update) {
    return [self->_updatesService.selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:self->_updatesService.launchedUpdate filters:update.manifestFilters];
  } asset:^(ABI48_0_0EXUpdatesAsset *asset, NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
    // do nothing for now
  } success:^(ABI48_0_0EXUpdatesUpdate * _Nullable update) {
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
