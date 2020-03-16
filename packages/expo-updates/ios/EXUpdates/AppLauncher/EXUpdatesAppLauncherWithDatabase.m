//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesAppLauncherWithDatabase.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesAppLauncherWithDatabase ()

@property (nullable, nonatomic, strong, readwrite) EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, strong, readwrite) NSURL *launchAssetUrl;
@property (nullable, nonatomic, strong, readwrite) NSMutableDictionary *assetFilesMap;

@property (nonatomic, strong) EXUpdatesFileDownloader *downloader;
@property (nonatomic, copy) EXUpdatesAppLauncherCompletionBlock completion;
@property (nonatomic, strong) dispatch_queue_t completionQueue;

@property (nonatomic, strong) dispatch_queue_t launcherQueue;
@property (nonatomic, assign) NSUInteger completedAssets;

@property (nonatomic, strong) NSError *launchAssetError;

@end

static NSString * const kEXUpdatesAppLauncherErrorDomain = @"AppLauncher";

@implementation EXUpdatesAppLauncherWithDatabase

- (instancetype)initWithCompletionQueue:(dispatch_queue_t)completionQueue
{
  if (self = [super init]) {
    _launcherQueue = dispatch_queue_create("expo.launcher.LauncherQueue", DISPATCH_QUEUE_SERIAL);
    _completedAssets = 0;
    _completionQueue = completionQueue;
  }
  return self;
}

+ (void)launchableUpdateWithSelectionPolicy:(id<EXUpdatesSelectionPolicy>)selectionPolicy
                                 completion:(EXUpdatesAppLauncherUpdateCompletionBlock)completion
                            completionQueue:(dispatch_queue_t)completionQueue
{
  EXUpdatesDatabase *database = [EXUpdatesAppController sharedInstance].database;
  dispatch_async(database.databaseQueue, ^{
    NSError *error;
    NSArray<EXUpdatesUpdate *> *launchableUpdates = [database launchableUpdatesWithError:&error];
    dispatch_async(completionQueue, ^{
      if (!launchableUpdates) {
        completion(error, nil);
      }
      completion(nil, [selectionPolicy launchableUpdateWithUpdates:launchableUpdates]);
    });
  });
}

- (void)launchUpdateWithSelectionPolicy:(id<EXUpdatesSelectionPolicy>)selectionPolicy
                             completion:(EXUpdatesAppLauncherCompletionBlock)completion
{
  NSAssert(!_completion, @"EXUpdatesAppLauncher:launchUpdateWithSelectionPolicy:successBlock should not be called twice on the same instance");
  _completion = completion;

  if (!_launchedUpdate) {
    [[self class] launchableUpdateWithSelectionPolicy:selectionPolicy completion:^(NSError * _Nullable error, EXUpdatesUpdate * _Nullable launchableUpdate) {
      if (error) {
        if (self->_completion) {
          self->_completion([NSError errorWithDomain:kEXUpdatesAppLauncherErrorDomain code:1011 userInfo:@{NSLocalizedDescriptionKey: @"No launchable updates found in database", NSUnderlyingErrorKey: error}], NO);
        }
      } else if (launchableUpdate) {
        self->_launchedUpdate = launchableUpdate;
        [self _ensureAllAssetsExist];
      }
    } completionQueue:_launcherQueue];
  } else {
    [self _ensureAllAssetsExist];
  }
}

- (void)_ensureAllAssetsExist
{
  _assetFilesMap = [NSMutableDictionary new];
  NSURL *updatesDirectory = EXUpdatesAppController.sharedInstance.updatesDirectory;

  if (_launchedUpdate) {
    NSUInteger totalAssetCount = _launchedUpdate.assets.count;
    for (EXUpdatesAsset *asset in _launchedUpdate.assets) {
      NSURL *assetLocalUrl = [updatesDirectory URLByAppendingPathComponent:asset.filename];
      [self _ensureAssetExists:asset withLocalUrl:assetLocalUrl completion:^(BOOL exists) {
        dispatch_assert_queue(self->_launcherQueue);
        self->_completedAssets++;

        if (asset.isLaunchAsset) {
          self->_launchAssetUrl = assetLocalUrl;
        } else {
          if (asset.localAssetsKey) {
            self->_assetFilesMap[asset.localAssetsKey] = assetLocalUrl.absoluteString;
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

- (void)_ensureAssetExists:(EXUpdatesAsset *)asset withLocalUrl:(NSURL *)assetLocalUrl completion:(void (^)(BOOL exists))completion
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
        NSLog(@"Error copying embedded asset with URL %@: %@", asset.url.absoluteString, error.localizedDescription);
      }

      [self _downloadAsset:asset withLocalUrl:assetLocalUrl completion:^(NSError * _Nullable error, EXUpdatesAsset *asset, NSURL *assetLocalUrl) {
        if (error) {
          if (asset.isLaunchAsset) {
            // save the error -- since this is the launch asset, the launcher will fail
            // so we want to propagate this error
            self->_launchAssetError = error;
          }
          NSLog(@"Failed to load missing asset with URL %@: %@", asset.url.absoluteString, error.localizedDescription);
          completion(NO);
        } else {
          // attempt to update the database record to match the newly downloaded asset
          // but don't block launching on this
          EXUpdatesDatabase *database = [EXUpdatesAppController sharedInstance].database;
          dispatch_async(database.databaseQueue, ^{
            NSError *error;
            [database updateAsset:asset error:&error];
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

- (void)_checkExistenceOfAsset:(EXUpdatesAsset *)asset withLocalUrl:(NSURL *)assetLocalUrl completion:(void (^)(BOOL exists))completion
{
  dispatch_async(EXUpdatesAppController.sharedInstance.assetFilesQueue, ^{
    BOOL exists = [NSFileManager.defaultManager fileExistsAtPath:[assetLocalUrl path]];
    dispatch_async(self->_launcherQueue, ^{
      completion(exists);
    });
  });
}

- (void)_maybeCopyAssetFromMainBundle:(EXUpdatesAsset *)asset
                         withLocalUrl:(NSURL *)assetLocalUrl
                           completion:(void (^)(BOOL success, NSError * _Nullable error))completion
{
  EXUpdatesUpdate *embeddedManifest = [EXUpdatesEmbeddedAppLoader embeddedManifest];
  if (embeddedManifest) {
    EXUpdatesAsset *matchingAsset;
    for (EXUpdatesAsset *embeddedAsset in embeddedManifest.assets) {
      if ([[embeddedAsset.url absoluteString] isEqualToString:[asset.url absoluteString]]) {
        matchingAsset = embeddedAsset;
        break;
      }
    }

    if (matchingAsset && matchingAsset.mainBundleFilename) {
      dispatch_async(EXUpdatesAppController.sharedInstance.assetFilesQueue, ^{
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

- (void)_downloadAsset:(EXUpdatesAsset *)asset
          withLocalUrl:(NSURL *)assetLocalUrl
            completion:(void (^)(NSError * _Nullable error, EXUpdatesAsset *asset, NSURL *assetLocalUrl))completion
{
  dispatch_async(EXUpdatesAppController.sharedInstance.assetFilesQueue, ^{
    [self.downloader downloadFileFromURL:asset.url toPath:[assetLocalUrl path] successBlock:^(NSData *data, NSURLResponse *response) {
      dispatch_async(self->_launcherQueue, ^{
        if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
          asset.headers = ((NSHTTPURLResponse *)response).allHeaderFields;
        }
        asset.contentHash = [EXUpdatesUtils sha256WithData:data];
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

- (EXUpdatesFileDownloader *)downloader
{
  if (!_downloader) {
    _downloader = [[EXUpdatesFileDownloader alloc] init];
  }
  return _downloader;
}

@end

NS_ASSUME_NONNULL_END
