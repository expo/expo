// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAsset.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesDatabaseIntegrityCheck.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesFileDownloader.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI48_0_0EXUpdatesDatabaseIntegrityCheck

+ (BOOL)runWithDatabase:(ABI48_0_0EXUpdatesDatabase *)database
              directory:(NSURL *)directory
                 config:(ABI48_0_0EXUpdatesConfig *)config
         embeddedUpdate:(nullable ABI48_0_0EXUpdatesUpdate *)embeddedUpdate
                  error:(NSError ** _Nullable)error
{
  NSError *err;
  NSArray<ABI48_0_0EXUpdatesAsset *> *assets = [database allAssetsWithError:&err];
  if (err) {
    *error = err;
    return NO;
  }

  NSMutableArray<ABI48_0_0EXUpdatesAsset *> *missingAssets = [NSMutableArray new];
  dispatch_sync([ABI48_0_0EXUpdatesFileDownloader assetFilesQueue], ^{
    for (ABI48_0_0EXUpdatesAsset *asset in assets) {
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

  NSArray<ABI48_0_0EXUpdatesUpdate *> *updatesWithEmbeddedStatus = [database allUpdatesWithStatus:ABI48_0_0EXUpdatesUpdateStatusEmbedded config:config error:&err];
  if (err) {
    *error = err;
    return NO;
  }

  NSMutableArray<ABI48_0_0EXUpdatesUpdate *> *updatesToDelete = [NSMutableArray new];
  for (ABI48_0_0EXUpdatesUpdate *update in updatesWithEmbeddedStatus) {
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

+ (BOOL)asset:(ABI48_0_0EXUpdatesAsset *)asset existsInDirectory:(NSURL *)directory
{
  NSURL *fileURL = [directory URLByAppendingPathComponent:asset.filename];
  return [NSFileManager.defaultManager fileExistsAtPath:fileURL.path];
}

@end

NS_ASSUME_NONNULL_END
