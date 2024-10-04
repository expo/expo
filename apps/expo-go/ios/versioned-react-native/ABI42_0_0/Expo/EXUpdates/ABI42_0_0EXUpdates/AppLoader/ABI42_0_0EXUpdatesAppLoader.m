//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesAppLoader+Private.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabase.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesFileDownloader.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUtils.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesAppLoader ()

@property (nonatomic, strong) NSMutableArray<ABI42_0_0EXUpdatesAsset *> *assetsToLoad;
@property (nonatomic, strong) NSMutableArray<ABI42_0_0EXUpdatesAsset *> *erroredAssets;
@property (nonatomic, strong) NSMutableArray<ABI42_0_0EXUpdatesAsset *> *finishedAssets;
@property (nonatomic, strong) NSMutableArray<ABI42_0_0EXUpdatesAsset *> *existingAssets;

@property (nonatomic, strong) NSLock *arrayLock;

@property (nonatomic, strong) dispatch_queue_t completionQueue;

@end

static NSString * const ABI42_0_0EXUpdatesAppLoaderErrorDomain = @"ABI42_0_0EXUpdatesAppLoader";

@implementation ABI42_0_0EXUpdatesAppLoader

- (instancetype)initWithConfig:(ABI42_0_0EXUpdatesConfig *)config
                      database:(ABI42_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               completionQueue:(dispatch_queue_t)completionQueue
{
  if (self = [super init]) {
    _assetsToLoad = [NSMutableArray new];
    _erroredAssets = [NSMutableArray new];
    _finishedAssets = [NSMutableArray new];
    _existingAssets = [NSMutableArray new];
    _arrayLock = [[NSLock alloc] init];
    _config = config;
    _database = database;
    _directory = directory;
    _completionQueue = completionQueue;
  }
  return self;
}

- (void)_reset
{
  _assetsToLoad = [NSMutableArray new];
  _erroredAssets = [NSMutableArray new];
  _finishedAssets = [NSMutableArray new];
  _existingAssets = [NSMutableArray new];
  _updateManifest = nil;
  _manifestBlock = nil;
  _assetBlock = nil;
  _successBlock = nil;
  _errorBlock = nil;
}

# pragma mark - subclass methods

- (void)loadUpdateFromUrl:(NSURL *)url
               onManifest:(ABI42_0_0EXUpdatesAppLoaderManifestBlock)manifestBlock
                    asset:(ABI42_0_0EXUpdatesAppLoaderAssetBlock)assetBlock
                  success:(ABI42_0_0EXUpdatesAppLoaderSuccessBlock)success
                    error:(ABI42_0_0EXUpdatesAppLoaderErrorBlock)error
{
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call ABI42_0_0EXUpdatesAppLoader#loadUpdate -- use a subclass instead" userInfo:nil];
}

- (void)downloadAsset:(ABI42_0_0EXUpdatesAsset *)asset
{
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call ABI42_0_0EXUpdatesAppLoader#loadUpdate -- use a subclass instead" userInfo:nil];
}

# pragma mark - loading and database logic

- (void)startLoadingFromManifest:(ABI42_0_0EXUpdatesUpdate *)updateManifest
{
  if (![self _shouldStartLoadingUpdate:updateManifest]) {
    if (_successBlock) {
      dispatch_async(_completionQueue, ^{
        self->_successBlock(nil);
      });
    }
    return;
  }

  if (updateManifest.isDevelopmentMode) {
    dispatch_async(_database.databaseQueue, ^{
      NSError *updateError;
      [self->_database addUpdate:updateManifest error:&updateError];

      if (updateError) {
        [self _finishWithError:updateError];
        return;
      }

      NSError *updateReadyError;
      [self->_database markUpdateFinished:updateManifest error:&updateReadyError];
      if (updateReadyError) {
        [self _finishWithError:updateReadyError];
        return;
      }

      ABI42_0_0EXUpdatesAppLoaderSuccessBlock successBlock;
      if (self->_successBlock) {
        successBlock = self->_successBlock;
      }
      dispatch_async(self->_completionQueue, ^{
        if (successBlock) {
          successBlock(updateManifest);
        }
        [self _reset];
      });
    });
    return;
  }

  dispatch_async(_database.databaseQueue, ^{
    NSError *existingUpdateError;
    ABI42_0_0EXUpdatesUpdate *existingUpdate = [self->_database updateWithId:updateManifest.updateId config:self->_config error:&existingUpdateError];

    // if something has gone wrong on the server and we have two updates with the same id
    // but different scope keys, we should try to launch something rather than show a cryptic
    // error to the user.
    if (existingUpdate && ![existingUpdate.scopeKey isEqualToString:updateManifest.scopeKey]) {
      NSError *setScopeKeyError;
      [self->_database setScopeKey:updateManifest.scopeKey onUpdate:existingUpdate error:&setScopeKeyError];

      if (setScopeKeyError) {
        [self _finishWithError:setScopeKeyError];
        return;
      }

      NSLog(@"ABI42_0_0EXUpdatesAppLoader: Loaded an update with the same ID but a different scopeKey than one we already have on disk. This is a server error. Overwriting the scopeKey and loading the existing update.");
    }

    if (existingUpdate && existingUpdate.status == ABI42_0_0EXUpdatesUpdateStatusReady) {
      if (self->_successBlock) {
        dispatch_async(self->_completionQueue, ^{
          self->_successBlock(updateManifest);
        });
      }
      return;
    }

    if (existingUpdate) {
      // we've already partially downloaded the update.
      // however, it's not ready, so we should try to download all the assets again.
      self->_updateManifest = updateManifest;
    } else {
      if (existingUpdateError) {
        NSLog(@"Failed to select old update from DB: %@", existingUpdateError.localizedDescription);
      }
      // no update already exists with this ID, so we need to insert it and download everything.
      self->_updateManifest = updateManifest;
      NSError *updateError;
      [self->_database addUpdate:self->_updateManifest error:&updateError];

      if (updateError) {
        [self _finishWithError:updateError];
        return;
      }
    }

    if (self->_updateManifest.assets && self->_updateManifest.assets.count > 0) {
      self->_assetsToLoad = [self->_updateManifest.assets mutableCopy];

      for (ABI42_0_0EXUpdatesAsset *asset in self->_updateManifest.assets) {
        // before downloading, check to see if we already have this asset in the database
        NSError *matchingAssetError;
        ABI42_0_0EXUpdatesAsset *matchingDbEntry = [self->_database assetWithKey:asset.key error:&matchingAssetError];

        if (matchingAssetError || !matchingDbEntry || !matchingDbEntry.filename) {
          [self downloadAsset:asset];
        } else {
          NSError *mergeError;
          [self->_database mergeAsset:asset withExistingEntry:matchingDbEntry error:&mergeError];
          if (mergeError) {
            NSLog(@"Failed to merge asset with existing database entry: %@", mergeError.localizedDescription);
          }
          // make sure the file actually exists on disk
          dispatch_async([ABI42_0_0EXUpdatesFileDownloader assetFilesQueue], ^{
            NSURL *urlOnDisk = [self->_directory URLByAppendingPathComponent:asset.filename];
            if ([[NSFileManager defaultManager] fileExistsAtPath:[urlOnDisk path]]) {
              // file already exists, we don't need to download it again
              dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                [self handleAssetDownloadAlreadyExists:asset];
              });
            } else {
              [self downloadAsset:asset];
            }
          });
        }
      }
    } else {
      [self _finish];
    }
  });
}

- (void)handleAssetDownloadAlreadyExists:(ABI42_0_0EXUpdatesAsset *)asset
{
  [_arrayLock lock];
  [self->_assetsToLoad removeObject:asset];
  [self->_existingAssets addObject:asset];
  [self _notifyProgressWithAsset:asset];
  if (![self->_assetsToLoad count]) {
    [self _finish];
  }
  [_arrayLock unlock];
}

- (void)handleAssetDownloadWithError:(NSError *)error asset:(ABI42_0_0EXUpdatesAsset *)asset
{
  // TODO: retry. for now log an error
  NSLog(@"error loading asset %@: %@", asset.key, error.localizedDescription);
  [_arrayLock lock];
  [self->_assetsToLoad removeObject:asset];
  [self->_erroredAssets addObject:asset];
  [self _notifyProgressWithAsset:asset];
  if (![self->_assetsToLoad count]) {
    [self _finish];
  }
  [_arrayLock unlock];
}

- (void)handleAssetDownloadWithData:(NSData *)data response:(nullable NSURLResponse *)response asset:(ABI42_0_0EXUpdatesAsset *)asset
{
  [_arrayLock lock];
  [self->_assetsToLoad removeObject:asset];

  if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
    asset.headers = ((NSHTTPURLResponse *)response).allHeaderFields;
  }
  asset.contentHash = [ABI42_0_0EXUpdatesUtils sha256WithData:data];
  asset.downloadTime = [NSDate date];
  [self->_finishedAssets addObject:asset];
  [self _notifyProgressWithAsset:asset];

  if (![self->_assetsToLoad count]) {
    [self _finish];
  }
  [_arrayLock unlock];
}

# pragma mark - internal

- (BOOL)_shouldStartLoadingUpdate:(ABI42_0_0EXUpdatesUpdate *)updateManifest
{
  return _manifestBlock(updateManifest);
}

/**
 * This should only be called on threads that have acquired self->_arrayLock
 */
- (void)_notifyProgressWithAsset:(ABI42_0_0EXUpdatesAsset *)asset
{
  if (_assetBlock) {
    _assetBlock(asset,
                _finishedAssets.count + _existingAssets.count,
                _erroredAssets.count,
                _finishedAssets.count + _existingAssets.count + _erroredAssets.count + _assetsToLoad.count);
  }
}

- (void)_finishWithError:(NSError *)error
{
  dispatch_async(_completionQueue, ^{
    if (self->_errorBlock) {
      self->_errorBlock(error);
    }
    [self _reset];
  });
}

- (void)_finish
{
  dispatch_async(_database.databaseQueue, ^{
    [self->_arrayLock lock];
    for (ABI42_0_0EXUpdatesAsset *existingAsset in self->_existingAssets) {
      NSError *error;
      BOOL existingAssetFound = [self->_database addExistingAsset:existingAsset toUpdateWithId:self->_updateManifest.updateId error:&error];
      if (!existingAssetFound) {
        // the database and filesystem have gotten out of sync
        // do our best to create a new entry for this file even though it already existed on disk
        // TODO: we should probably get rid of this assumption that if an asset exists on disk with the same filename, it's the same asset
        NSData *contents = [NSData dataWithContentsOfURL:[self->_directory URLByAppendingPathComponent:existingAsset.filename]];
        existingAsset.contentHash = [ABI42_0_0EXUpdatesUtils sha256WithData:contents];
        existingAsset.downloadTime = [NSDate date];
        [self->_finishedAssets addObject:existingAsset];
      }
      if (error) {
        NSLog(@"Error searching for existing asset in DB: %@", error.localizedDescription);
      }
    }
    NSError *assetError;
    [self->_database addNewAssets:self->_finishedAssets toUpdateWithId:self->_updateManifest.updateId error:&assetError];
    if (assetError) {
      [self->_arrayLock unlock];
      [self _finishWithError:assetError];
      return;
    }

    if (![self->_erroredAssets count]) {
      NSError *updateReadyError;
      [self->_database markUpdateFinished:self->_updateManifest error:&updateReadyError];
      if (updateReadyError) {
        [self->_arrayLock unlock];
        [self _finishWithError:updateReadyError];
        return;
      }
    }

    ABI42_0_0EXUpdatesAppLoaderSuccessBlock successBlock;
    ABI42_0_0EXUpdatesAppLoaderErrorBlock errorBlock;

    if (self->_erroredAssets.count) {
      if (self->_errorBlock) {
        errorBlock = self->_errorBlock;
      }
    } else {
      if (self->_successBlock) {
        successBlock = self->_successBlock;
      }
    }

    [self->_arrayLock unlock];

    dispatch_async(self->_completionQueue, ^{
      if (errorBlock) {
        errorBlock([NSError errorWithDomain:ABI42_0_0EXUpdatesAppLoaderErrorDomain
                                       code:1012
                                   userInfo:@{NSLocalizedDescriptionKey: @"Failed to load all assets"}]);
      } else if (successBlock) {
        successBlock(self->_updateManifest);
      }
      [self _reset];
    });
  });
}

@end

NS_ASSUME_NONNULL_END
