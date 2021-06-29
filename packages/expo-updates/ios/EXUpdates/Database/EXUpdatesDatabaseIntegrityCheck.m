// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesDatabaseIntegrityCheck.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesDatabaseIntegrityCheck

+ (BOOL)runWithDatabase:(EXUpdatesDatabase *)database
              directory:(NSURL *)directory
                 config:(EXUpdatesConfig *)config
         embeddedUpdate:(nullable EXUpdatesUpdate *)embeddedUpdate
                  error:(NSError ** _Nullable)error
{
  NSError *err;
  NSArray<EXUpdatesAsset *> *assets = [database allAssetsWithError:&err];
  if (err) {
    *error = err;
    return NO;
  }

  NSMutableArray<EXUpdatesAsset *> *missingAssets = [NSMutableArray new];
  dispatch_sync([EXUpdatesFileDownloader assetFilesQueue], ^{
    for (EXUpdatesAsset *asset in assets) {
      if (![[self class] asset:asset existsInDirectory:directory]) {
        [missingAssets addObject:asset];
      }
    }
  });

  if (missingAssets.count > 0) {
    [database markMissingAssets:missingAssets error:&err];
    if (err) {
      *error = err;
      return NO;
    }
  }

  NSArray<EXUpdatesUpdate *> *updatesWithEmbeddedStatus = [database allUpdatesWithStatus:EXUpdatesUpdateStatusEmbedded config:config error:&err];
  if (err) {
    *error = err;
    return NO;
  }

  NSMutableArray<EXUpdatesUpdate *> *updatesToDelete = [NSMutableArray new];
  for (EXUpdatesUpdate *update in updatesWithEmbeddedStatus) {
    if (!embeddedUpdate || ![update.updateId isEqual:embeddedUpdate.updateId]) {
      [updatesToDelete addObject:update];
    }
  }

  if (updatesToDelete.count > 0) {
    [database deleteUpdates:updatesToDelete error:&err];
    if (err) {
      *error = err;
      return NO;
    }
  }
  return YES;
}

+ (BOOL)asset:(EXUpdatesAsset *)asset existsInDirectory:(NSURL *)directory
{
  NSURL *fileURL = [directory URLByAppendingPathComponent:asset.filename];
  return [NSFileManager.defaultManager fileExistsAtPath:fileURL.path];
}

@end

NS_ASSUME_NONNULL_END
