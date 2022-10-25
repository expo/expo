//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesFileDownloader.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesReaper.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI47_0_0EXUpdatesReaper

+ (void)reapUnusedUpdatesWithConfig:(ABI47_0_0EXUpdatesConfig *)config
                           database:(ABI47_0_0EXUpdatesDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(ABI47_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                     launchedUpdate:(ABI47_0_0EXUpdatesUpdate *)launchedUpdate
{
  dispatch_async(database.databaseQueue, ^{
    NSError *error;
    NSDate *beginDeleteFromDatabase = [NSDate date];

    [database markUpdateFinished:launchedUpdate error:&error];
    if (error) {
      NSLog(@"Error reaping updates: %@", error.localizedDescription);
      return;
    }

    NSArray<ABI47_0_0EXUpdatesUpdate *> *allUpdates = [database allUpdatesWithConfig:config error:&error];
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

    NSArray<ABI47_0_0EXUpdatesUpdate *> *updatesToDelete = [selectionPolicy updatesToDeleteWithLaunchedUpdate:launchedUpdate updates:allUpdates filters:manifestFilters];
    [database deleteUpdates:updatesToDelete error:&error];
    if (error) {
      NSLog(@"Error reaping updates: %@", error.localizedDescription);
      return;
    }

    NSArray<ABI47_0_0EXUpdatesAsset *> *assetsForDeletion = [database deleteUnusedAssetsWithError:&error];
    if (error) {
      NSLog(@"Error reaping updates: %@", error.localizedDescription);
      return;
    }

    NSLog(@"Deleted assets and updates from SQLite in %f ms", [beginDeleteFromDatabase timeIntervalSinceNow] * -1000);

    dispatch_async([ABI47_0_0EXUpdatesFileDownloader assetFilesQueue], ^{
      NSUInteger deletedAssets = 0;
      NSMutableArray<ABI47_0_0EXUpdatesAsset *> *erroredAssets = [NSMutableArray new];

      NSDate *beginDeleteAssets = [NSDate date];
      for (ABI47_0_0EXUpdatesAsset *asset in assetsForDeletion) {
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
      for (ABI47_0_0EXUpdatesAsset *asset in erroredAssets) {
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
