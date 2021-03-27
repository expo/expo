//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncFileDownloader.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncReaper.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI41_0_0EXSyncReaper

+ (void)reapUnusedUpdatesWithConfig:(ABI41_0_0EXSyncConfig *)config
                           database:(ABI41_0_0EXSyncDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(id<ABI41_0_0EXSyncSelectionPolicy>)selectionPolicy
                     launchedUpdate:(ABI41_0_0EXSyncManifest *)launchedUpdate
{
  dispatch_async(database.databaseQueue, ^{
    NSError *error;
    NSDate *beginDeleteFromDatabase = [NSDate date];

    [database markUpdateFinished:launchedUpdate error:&error];
    if (error) {
      NSLog(@"Error reaping updates: %@", error.localizedDescription);
      return;
    }

    NSArray<ABI41_0_0EXSyncManifest *> *allUpdates = [database allUpdatesWithConfig:config error:&error];
    if (!allUpdates || error) {
      NSLog(@"Error reaping updates: %@", error.localizedDescription);
      return;
    }

    NSError *manifestFiltersError;
    NSDictionary *manifestFilters = [database manifestFiltersWithScopeKey:config.scopeKey error:&manifestFiltersError];
    if (manifestFiltersError) {
      NSLog(@"Error selecting manifest filters while reaping updates: %@", error.localizedDescription);
      return;
    }

    NSArray<ABI41_0_0EXSyncManifest *> *updatesToDelete = [selectionPolicy updatesToDeleteWithLaunchedUpdate:launchedUpdate updates:allUpdates filters:manifestFilters];
    [database deleteUpdates:updatesToDelete error:&error];
    if (error) {
      NSLog(@"Error reaping updates: %@", error.localizedDescription);
      return;
    }

    NSArray<ABI41_0_0EXSyncAsset *> *assetsForDeletion = [database deleteUnusedAssetsWithError:&error];
    if (error) {
      NSLog(@"Error reaping updates: %@", error.localizedDescription);
      return;
    }

    NSLog(@"Deleted assets and updates from SQLite in %f ms", [beginDeleteFromDatabase timeIntervalSinceNow] * -1000);

    dispatch_async([ABI41_0_0EXSyncFileDownloader assetFilesQueue], ^{
      NSUInteger deletedAssets = 0;
      NSMutableArray<ABI41_0_0EXSyncAsset *> *erroredAssets = [NSMutableArray new];

      NSDate *beginDeleteAssets = [NSDate date];
      for (ABI41_0_0EXSyncAsset *asset in assetsForDeletion) {
        NSURL *localUrl = [directory URLByAppendingPathComponent:asset.filename];
        NSError *error;
        if ([NSFileManager.defaultManager fileExistsAtPath:localUrl.path] && ![NSFileManager.defaultManager removeItemAtURL:localUrl error:&error]) {
          NSLog(@"Error deleting asset at %@: %@", localUrl, error.localizedDescription);
          [erroredAssets addObject:asset];
        } else {
          deletedAssets++;
        }
      }
      NSLog(@"Deleted %lu assets from disk in %f ms", (unsigned long)deletedAssets, [beginDeleteAssets timeIntervalSinceNow] * -1000);

      NSDate *beginRetryDeletes = [NSDate date];
      // retry errored deletions
      for (ABI41_0_0EXSyncAsset *asset in erroredAssets) {
        NSURL *localUrl = [directory URLByAppendingPathComponent:asset.filename];
        NSError *error;
        if ([NSFileManager.defaultManager fileExistsAtPath:localUrl.path] && ![NSFileManager.defaultManager removeItemAtURL:localUrl error:&error]) {
          NSLog(@"Retried deleting asset at %@ and failed again: %@", localUrl, error.localizedDescription);
        }
      }
      NSLog(@"Retried deleting assets from disk in %f ms", [beginRetryDeletes timeIntervalSinceNow] * -1000);
    });
  });
}

@end

NS_ASSUME_NONNULL_END
