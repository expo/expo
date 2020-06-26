// Copyright 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesRemoteAppLoader.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesModule.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@interface EXUpdatesModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXUpdatesModule

UM_EXPORT_MODULE(ExpoUpdates);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSDictionary *)constantsToExport
{
  EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
  if (!controller.isStarted) {
    return @{
      @"isEnabled": @(NO)
    };
  }
  EXUpdatesUpdate *launchedUpdate = controller.launchedUpdate;
  if (!launchedUpdate) {
    return @{
      @"isEnabled": @(NO)
    };
  } else {
    return @{
      @"isEnabled": @(YES),
      @"isUsingEmbeddedAssets": @(controller.isUsingEmbeddedAssets),
      @"updateId": launchedUpdate.updateId.UUIDString ?: @"",
      @"manifest": launchedUpdate.rawManifest ?: @{},
      @"releaseChannel": [EXUpdatesConfig sharedInstance].releaseChannel,
      @"localAssets": controller.assetFilesMap ?: @{},
      @"isEmergencyLaunch": @(controller.isEmergencyLaunch)
    };
  }
  
}

UM_EXPORT_METHOD_AS(reload,
                    reloadAsync:(UMPromiseResolveBlock)resolve
                         reject:(UMPromiseRejectBlock)reject)
{
  if (![EXUpdatesAppController sharedInstance].isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot use this method. Otherwise, make sure you have called [[EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  [[EXUpdatesAppController sharedInstance] requestRelaunchWithCompletion:^(BOOL success) {
    if (success) {
      resolve(nil);
    } else {
      reject(@"ERR_UPDATES_RELOAD", @"Could not reload application. Ensure you have set the `bridge` property of EXUpdatesAppController.", nil);
    }
  }];
}

UM_EXPORT_METHOD_AS(checkForUpdateAsync,
                    checkForUpdateAsync:(UMPromiseResolveBlock)resolve
                                 reject:(UMPromiseRejectBlock)reject)
{
  if (![EXUpdatesAppController sharedInstance].isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot check for updates. Otherwise, make sure you have called [[EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  EXUpdatesFileDownloader *fileDownloader = [[EXUpdatesFileDownloader alloc] init];
  [fileDownloader downloadManifestFromURL:[EXUpdatesConfig sharedInstance].updateUrl successBlock:^(EXUpdatesUpdate *update) {
    EXUpdatesUpdate *launchedUpdate = [EXUpdatesAppController sharedInstance].launchedUpdate;
    id<EXUpdatesSelectionPolicy> selectionPolicy = [EXUpdatesAppController sharedInstance].selectionPolicy;
    if ([selectionPolicy shouldLoadNewUpdate:update withLaunchedUpdate:launchedUpdate]) {
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
  if (![EXUpdatesAppController sharedInstance].isStarted) {
    reject(@"ERR_UPDATES_DISABLED", @"The updates module controller has not been properly initialized. If you're in development mode, you cannot fetch updates. Otherwise, make sure you have called [[EXUpdatesAppController sharedInstance] start].", nil);
    return;
  }

  EXUpdatesRemoteAppLoader *remoteAppLoader = [[EXUpdatesRemoteAppLoader alloc] initWithCompletionQueue:self.methodQueue];
  [remoteAppLoader loadUpdateFromUrl:[EXUpdatesConfig sharedInstance].updateUrl success:^(EXUpdatesUpdate * _Nullable update) {
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
