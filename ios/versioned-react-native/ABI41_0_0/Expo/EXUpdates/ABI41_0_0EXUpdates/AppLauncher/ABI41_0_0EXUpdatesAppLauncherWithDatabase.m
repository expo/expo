//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesAppLauncherWithDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesFileDownloader.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXUpdatesAppLauncherWithDatabase ()

@property (nullable, nonatomic, strong, readwrite) ABI41_0_0EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, strong, readwrite) NSURL *launchAssetUrl;
@property (nullable, nonatomic, strong, readwrite) NSMutableDictionary *assetFilesMap;

@property (nonatomic, strong) ABI41_0_0EXUpdatesConfig *config;
@property (nonatomic, strong) ABI41_0_0EXUpdatesDatabase *database;
@property (nonatomic, strong) NSURL *directory;
@property (nonatomic, strong) ABI41_0_0EXUpdatesFileDownloader *downloader;
@property (nonatomic, copy) ABI41_0_0EXUpdatesAppLauncherCompletionBlock completion;
@property (nonatomic, strong) dispatch_queue_t completionQueue;

@property (nonatomic, strong) dispatch_queue_t launcherQueue;
@property (nonatomic, assign) NSUInteger completedAssets;

@property (nonatomic, strong) NSError *launchAssetError;

@end

static NSString * const ABI41_0_0EXUpdatesAppLauncherErrorDomain = @"AppLauncher";

@implementation ABI41_0_0EXUpdatesAppLauncherWithDatabase

- (instancetype)initWithConfig:(ABI41_0_0EXUpdatesConfig *)config
                      database:(ABI41_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue
{
  if (self = [super init]) {
    _launcherQueue = dispatch_queue_create("expo.launcher.LauncherQueue", DISPATCH_QUEUE_SERIAL);
    _completedAssets = 0;
    _config = config;
    _database = database;
    _directory = directory;
    _completionQueue = completionQueue;
  }
  return self;
}

+ (void)launchableUpdateWithConfig:(ABI41_0_0EXUpdatesConfig *)config
                          database:(ABI41_0_0EXUpdatesDatabase *)database
                   selectionPolicy:(id<ABI41_0_0EXUpdatesSelectionPolicy>)selectionPolicy
                        completion:(ABI41_0_0EXUpdatesAppLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue
{
  dispatch_async(database.databaseQueue, ^{
    NSError *error;
    NSArray<ABI41_0_0EXUpdatesUpdate *> *launchableUpdates = [database launchableUpdatesWithConfig:config error:&error];
    NSError *manifestFiltersError;
    NSDictionary *manifestFilters = [database manifestFiltersWithScopeKey:config.scopeKey error:&manifestFiltersError];
    dispatch_async(completionQueue, ^{
      if (!launchableUpdates) {
        completion(error, nil);
        return;
      }
      if (manifestFiltersError) {
        completion(manifestFiltersError, nil);
        return;
      }

      // We can only run an update marked as embedded if it's actually the update embedded in the
      // current binary. We might have an older update from a previous binary still listed in the
      // database with Embedded status so we need to filter that out here.
      ABI41_0_0EXUpdatesUpdate *embeddedManifest = [ABI41_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:config database:database];
      NSMutableArray<ABI41_0_0EXUpdatesUpdate *>*filteredLaunchableUpdates = [NSMutableArray new];
      for (ABI41_0_0EXUpdatesUpdate *update in launchableUpdates) {
        if (update.status == ABI41_0_0EXUpdatesUpdateStatusEmbedded) {
          if (embeddedManifest && ![update.updateId isEqual:embeddedManifest.updateId]) {
            continue;
          }
        }
        [filteredLaunchableUpdates addObject:update];
      }

      completion(nil, [selectionPolicy launchableUpdateWithUpdates:filteredLaunchableUpdates filters:manifestFilters]);
    });
  });
}

- (void)launchUpdateWithSelectionPolicy:(id<ABI41_0_0EXUpdatesSelectionPolicy>)selectionPolicy
                             completion:(ABI41_0_0EXUpdatesAppLauncherCompletionBlock)completion
{
  NSAssert(!_completion, @"ABI41_0_0EXUpdatesAppLauncher:launchUpdateWithSelectionPolicy:successBlock should not be called twice on the same instance");
  _completion = completion;

  if (!_launchedUpdate) {
    [[self class] launchableUpdateWithConfig:_config database:_database selectionPolicy:selectionPolicy completion:^(NSError * _Nullable error, ABI41_0_0EXUpdatesUpdate * _Nullable launchableUpdate) {
      if (error || !launchableUpdate) {
        if (self->_completion) {
          dispatch_async(self->_completionQueue, ^{
            NSMutableDictionary *userInfo = [NSMutableDictionary new];
            userInfo[NSLocalizedDescriptionKey] = @"No launchable updates found in database";
            if (error) {
              userInfo[NSUnderlyingErrorKey] = error;
            }
            self->_completion([NSError errorWithDomain:ABI41_0_0EXUpdatesAppLauncherErrorDomain code:1011 userInfo:userInfo], NO);
          });
        }
      } else {
        self->_launchedUpdate = launchableUpdate;
        [self _ensureAllAssetsExist];
      }
    } completionQueue:_launcherQueue];
  } else {
    [self _ensureAllAssetsExist];
  }
}

- (BOOL)isUsingEmbeddedAssets
{
  return _assetFilesMap == nil;
}

- (void)_ensureAllAssetsExist
{
  if (_launchedUpdate.status == ABI41_0_0EXUpdatesUpdateStatusEmbedded) {
    NSAssert(_assetFilesMap == nil, @"assetFilesMap should be null for embedded updates");
    _launchAssetUrl = [[NSBundle mainBundle] URLForResource:ABI41_0_0EXUpdatesBareEmbeddedBundleFilename withExtension:ABI41_0_0EXUpdatesBareEmbeddedBundleFileType];

    dispatch_async(self->_completionQueue, ^{
      self->_completion(self->_launchAssetError, self->_launchAssetUrl != nil);
      self->_completion = nil;
    });
    return;
  } else if (_launchedUpdate.status == ABI41_0_0EXUpdatesUpdateStatusDevelopment) {
    dispatch_async(self->_completionQueue, ^{
      self->_completion(nil, YES);
      self->_completion = nil;
    });
    return;
  }

  _assetFilesMap = [NSMutableDictionary new];

  if (_launchedUpdate) {
    NSUInteger totalAssetCount = _launchedUpdate.assets.count;
    for (ABI41_0_0EXUpdatesAsset *asset in _launchedUpdate.assets) {
      NSURL *assetLocalUrl = [_directory URLByAppendingPathComponent:asset.filename];
      [self _ensureAssetExists:asset withLocalUrl:assetLocalUrl completion:^(BOOL exists) {
        dispatch_assert_queue(self->_launcherQueue);
        self->_completedAssets++;

        if (exists) {
          if (asset.isLaunchAsset) {
            self->_launchAssetUrl = assetLocalUrl;
          } else {
            if (asset.key) {
              self->_assetFilesMap[asset.key] = assetLocalUrl.absoluteString;
            }
          }
        }

        if (self->_completedAssets == totalAssetCount) {
          dispatch_async(self->_completionQueue, ^{
            self->_completion(self->_launchAssetError, self->_launchAssetUrl != nil);
            self->_completion = nil;
          });
        }
      }];
    }
  }
}

- (void)_ensureAssetExists:(ABI41_0_0EXUpdatesAsset *)asset withLocalUrl:(NSURL *)assetLocalUrl completion:(void (^)(BOOL exists))completion
{
  [self _checkExistenceOfAsset:asset withLocalUrl:assetLocalUrl completion:^(BOOL exists) {
    if (exists) {
      completion(YES);
      return;
    }

    [self _maybeCopyAssetFromMainBundle:asset withLocalUrl:assetLocalUrl completion:^(BOOL success, NSError * _Nullable error) {
      if (success) {
        completion(YES);
        return;
      }

      if (error) {
        NSLog(@"Error copying embedded asset %@: %@", asset.key, error.localizedDescription);
      }

      [self _downloadAsset:asset withLocalUrl:assetLocalUrl completion:^(NSError * _Nullable error, ABI41_0_0EXUpdatesAsset *asset, NSURL *assetLocalUrl) {
        if (error) {
          if (asset.isLaunchAsset) {
            // save the error -- since this is the launch asset, the launcher will fail
            // so we want to propagate this error
            self->_launchAssetError = error;
          }
          NSLog(@"Failed to load missing asset %@: %@", asset.key, error.localizedDescription);
          completion(NO);
        } else {
          // attempt to update the database record to match the newly downloaded asset
          // but don't block launching on this
          dispatch_async(self->_database.databaseQueue, ^{
            NSError *error;
            [self->_database updateAsset:asset error:&error];
            if (error) {
              NSLog(@"Could not write data for downloaded asset to database: %@", error.localizedDescription);
            }
          });

          completion(YES);
        }
      }];
    }];
  }];
}

- (void)_checkExistenceOfAsset:(ABI41_0_0EXUpdatesAsset *)asset withLocalUrl:(NSURL *)assetLocalUrl completion:(void (^)(BOOL exists))completion
{
  dispatch_async([ABI41_0_0EXUpdatesFileDownloader assetFilesQueue], ^{
    BOOL exists = [NSFileManager.defaultManager fileExistsAtPath:[assetLocalUrl path]];
    dispatch_async(self->_launcherQueue, ^{
      completion(exists);
    });
  });
}

- (void)_maybeCopyAssetFromMainBundle:(ABI41_0_0EXUpdatesAsset *)asset
                         withLocalUrl:(NSURL *)assetLocalUrl
                           completion:(void (^)(BOOL success, NSError * _Nullable error))completion
{
  ABI41_0_0EXUpdatesUpdate *embeddedManifest = [ABI41_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:_config database:_database];
  if (embeddedManifest) {
    ABI41_0_0EXUpdatesAsset *matchingAsset;
    for (ABI41_0_0EXUpdatesAsset *embeddedAsset in embeddedManifest.assets) {
      if (embeddedAsset.key && [embeddedAsset.key isEqualToString:asset.key]) {
        matchingAsset = embeddedAsset;
        break;
      }
    }

    if (matchingAsset && matchingAsset.mainBundleFilename) {
      dispatch_async([ABI41_0_0EXUpdatesFileDownloader assetFilesQueue], ^{
        NSString *bundlePath = [[NSBundle mainBundle] pathForResource:matchingAsset.mainBundleFilename ofType:matchingAsset.type];
        NSError *error;
        BOOL success = [NSFileManager.defaultManager copyItemAtPath:bundlePath toPath:[assetLocalUrl path] error:&error];
        dispatch_async(self->_launcherQueue, ^{
          completion(success, error);
        });
      });
      return;
    }
  }
  
  completion(NO, nil);
}

- (void)_downloadAsset:(ABI41_0_0EXUpdatesAsset *)asset
          withLocalUrl:(NSURL *)assetLocalUrl
            completion:(void (^)(NSError * _Nullable error, ABI41_0_0EXUpdatesAsset *asset, NSURL *assetLocalUrl))completion
{
  if (!asset.url) {
    completion([NSError errorWithDomain:ABI41_0_0EXUpdatesAppLauncherErrorDomain code:1007 userInfo:@{NSLocalizedDescriptionKey: @"Failed to download asset with no URL provided"}], asset, assetLocalUrl);
  }
  dispatch_async([ABI41_0_0EXUpdatesFileDownloader assetFilesQueue], ^{
    [self.downloader downloadFileFromURL:asset.url toPath:[assetLocalUrl path] successBlock:^(NSData *data, NSURLResponse *response) {
      dispatch_async(self->_launcherQueue, ^{
        if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
          asset.headers = ((NSHTTPURLResponse *)response).allHeaderFields;
        }
        asset.contentHash = [ABI41_0_0EXUpdatesUtils sha256WithData:data];
        asset.downloadTime = [NSDate date];
        completion(nil, asset, assetLocalUrl);
      });
    } errorBlock:^(NSError *error, NSURLResponse *response) {
      dispatch_async(self->_launcherQueue, ^{
        completion(error, asset, assetLocalUrl);
      });
    }];
  });
}

- (ABI41_0_0EXUpdatesFileDownloader *)downloader
{
  if (!_downloader) {
    _downloader = [[ABI41_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:_config];
  }
  return _downloader;
}

@end

NS_ASSUME_NONNULL_END
