//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesAppLoader+Private.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesUtils.h>
#import <UMCore/UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesAppLoader ()

@property (nonatomic, strong) NSMutableArray<EXUpdatesAsset *> *assetsToLoad;
@property (nonatomic, strong) NSMutableArray<EXUpdatesAsset *> *erroredAssets;
@property (nonatomic, strong) NSMutableArray<EXUpdatesAsset *> *finishedAssets;
@property (nonatomic, strong) NSMutableArray<EXUpdatesAsset *> *existingAssets;

@property (nonatomic, strong) NSLock *arrayLock;

@property (nonatomic, strong) dispatch_queue_t completionQueue;

@end

static NSString * const kEXUpdatesAppLoaderErrorDomain = @"EXUpdatesAppLoader";

@implementation EXUpdatesAppLoader

- (instancetype)initWithCompletionQueue:(dispatch_queue_t)completionQueue
{
  if (self = [super init]) {
    _assetsToLoad = [NSMutableArray new];
    _erroredAssets = [NSMutableArray new];
    _finishedAssets = [NSMutableArray new];
    _existingAssets = [NSMutableArray new];
    _arrayLock = [[NSLock alloc] init];
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
  _successBlock = nil;
  _errorBlock = nil;
}

# pragma mark - subclass methods

- (void)loadUpdateFromUrl:(NSURL *)url
                  success:(EXUpdatesAppLoaderSuccessBlock)success
                    error:(EXUpdatesAppLoaderErrorBlock)error
{
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call EXUpdatesAppLoader#loadUpdate -- use a subclass instead" userInfo:nil];
}

- (void)downloadAsset:(EXUpdatesAsset *)asset
{
  @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Should not call EXUpdatesAppLoader#loadUpdate -- use a subclass instead" userInfo:nil];
}

# pragma mark - loading and database logic

- (void)startLoadingFromManifest:(EXUpdatesUpdate *)updateManifest
{
  if (![self _shouldStartLoadingUpdate:updateManifest]) {
    if (_successBlock) {
      _successBlock(nil);
    }
    return;
  }

  EXUpdatesDatabase *database = [EXUpdatesAppController sharedInstance].database;
  dispatch_async(database.databaseQueue, ^{
    NSError *existingUpdateError;
    EXUpdatesUpdate *existingUpdate = [database updateWithId:updateManifest.updateId error:&existingUpdateError];

    if (existingUpdate && existingUpdate.status == EXUpdatesUpdateStatusReady) {
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
      [database addUpdate:self->_updateManifest error:&updateError];

      if (updateError) {
        [self _finishWithError:updateError];
        return;
      }
    }

    if (self->_updateManifest.assets && self->_updateManifest.assets.count > 0) {
      self->_assetsToLoad = [self->_updateManifest.assets mutableCopy];

      NSURL *updatesDirectory = EXUpdatesAppController.sharedInstance.updatesDirectory;
      for (EXUpdatesAsset *asset in self->_updateManifest.assets) {
        // before downloading, check to see if we already have this asset in the database
        NSError *matchingAssetError;
        EXUpdatesAsset *matchingDbEntry = [database assetWithPackagerKey:asset.packagerKey error:&matchingAssetError];

        if (matchingAssetError || !matchingDbEntry || !matchingDbEntry.filename) {
          [self downloadAsset:asset];
        } else {
          NSError *mergeError;
          [database mergeAsset:asset withExistingEntry:matchingDbEntry error:&mergeError];
          if (mergeError) {
            NSLog(@"Failed to merge asset with existing database entry: %@", mergeError.localizedDescription);
          }
          // make sure the file actually exists on disk
          dispatch_async(EXUpdatesAppController.sharedInstance.assetFilesQueue, ^{
            NSURL *urlOnDisk = [updatesDirectory URLByAppendingPathComponent:asset.filename];
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

- (void)handleAssetDownloadAlreadyExists:(EXUpdatesAsset *)asset
{
  [_arrayLock lock];
  [self->_assetsToLoad removeObject:asset];
  [self->_existingAssets addObject:asset];
  if (![self->_assetsToLoad count]) {
    [self _finish];
  }
  [_arrayLock unlock];
}

- (void)handleAssetDownloadWithError:(NSError *)error asset:(EXUpdatesAsset *)asset
{
  // TODO: retry. for now log an error
  NSLog(@"error loading asset %@: %@", asset.packagerKey, error.localizedDescription);
  [_arrayLock lock];
  [self->_assetsToLoad removeObject:asset];
  [self->_erroredAssets addObject:asset];
  if (![self->_assetsToLoad count]) {
    [self _finish];
  }
  [_arrayLock unlock];
}

- (void)handleAssetDownloadWithData:(NSData *)data response:(nullable NSURLResponse *)response asset:(EXUpdatesAsset *)asset
{
  [_arrayLock lock];
  [self->_assetsToLoad removeObject:asset];

  if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
    asset.headers = ((NSHTTPURLResponse *)response).allHeaderFields;
  }
  asset.contentHash = [EXUpdatesUtils sha256WithData:data];
  asset.downloadTime = [NSDate date];
  [self->_finishedAssets addObject:asset];

  if (![self->_assetsToLoad count]) {
    [self _finish];
  }
  [_arrayLock unlock];
}

# pragma mark - internal

- (BOOL)_shouldStartLoadingUpdate:(EXUpdatesUpdate *)updateManifest
{
  EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
  return [controller.selectionPolicy shouldLoadNewUpdate:updateManifest withLaunchedUpdate:controller.launchedUpdate];
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
  EXUpdatesDatabase *database = [EXUpdatesAppController sharedInstance].database;
  dispatch_async(database.databaseQueue, ^{
    [self->_arrayLock lock];
    for (EXUpdatesAsset *existingAsset in self->_existingAssets) {
      NSError *error;
      BOOL existingAssetFound = [database addExistingAsset:existingAsset toUpdateWithId:self->_updateManifest.updateId error:&error];
      if (!existingAssetFound) {
        // the database and filesystem have gotten out of sync
        // do our best to create a new entry for this file even though it already existed on disk
        NSData *contents = [NSData dataWithContentsOfURL:[[EXUpdatesAppController sharedInstance].updatesDirectory URLByAppendingPathComponent:existingAsset.filename]];
        existingAsset.contentHash = [EXUpdatesUtils sha256WithData:contents];
        existingAsset.downloadTime = [NSDate date];
        [self->_finishedAssets addObject:existingAsset];
      }
      if (error) {
        NSLog(@"Error searching for existing asset in DB: %@", error.localizedDescription);
      }
    }
    NSError *assetError;
    [database addNewAssets:self->_finishedAssets toUpdateWithId:self->_updateManifest.updateId error:&assetError];
    if (assetError) {
      [self->_arrayLock unlock];
      [self _finishWithError:assetError];
      return;
    }

    if (![self->_erroredAssets count]) {
      NSError *updateReadyError;
      [database markUpdateFinished:self->_updateManifest error:&updateReadyError];
      if (updateReadyError) {
        [self->_arrayLock unlock];
        [self _finishWithError:updateReadyError];
        return;
      }
    }

    EXUpdatesAppLoaderSuccessBlock successBlock;
    EXUpdatesAppLoaderErrorBlock errorBlock;

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
        errorBlock([NSError errorWithDomain:kEXUpdatesAppLoaderErrorDomain
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
