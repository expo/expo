//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesFileDownloader.h>
#import <EXUpdates/EXUpdatesReaper.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesReaper

+ (void)reapUnusedUpdatesWithConfig:(EXUpdatesConfig *)config
                           database:(EXUpdatesDatabase *)database
                          directory:(NSURL *)directory
                    selectionPolicy:(EXUpdatesSelectionPolicy *)selectionPolicy
                     launchedUpdate:(EXUpdatesUpdate *)launchedUpdate
{
  dispatch_async(database.databaseQueue, ^{
    NSError *error;
    NSDate *beginDeleteFromDatabase = [NSDate date];

    [database markUpdateFinished:launchedUpdate error:&error];
    if (error) {
      NSLog(@"Error reaping updates: %@", error.localizedDescription);
      return;
    }

    NSArray<EXUpdatesUpdate *> *allUpdates = [database allUpdatesWithConfig:config error:&error];
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

    NSArray<EXUpdatesUpdate *> *updatesToDelete = [selectionPolicy updatesToDeleteWithLaunchedUpdate:launchedUpdate updates:allUpdates filters:manifestFilters];
    [database deleteUpdates:updatesToDelete error:&error];
    if (error) {
      NSLog(@"Error reaping updates: %@", error.localizedDescription);
      return;
    }

    NSArray<EXUpdatesAsset *> *assetsForDeletion = [database deleteUnusedAssetsWithError:&error];
    if (error) {
      NSLog(@"Error reaping updates: %@", error.localizedDescription);
      return;
    }

    NSLog(@"Deleted assets and updates from SQLite in %f ms", [beginDeleteFromDatabase timeIntervalSinceNow] * -1000);

    dispatch_async([EXUpdatesFileDownloader assetFilesQueue], ^{
      NSUInteger deletedAssets = 0;
      NSMutableArray<EXUpdatesAsset *> *erroredAssets = [NSMutableArray new];

      NSDate *beginDeleteAssets = [NSDate date];
      for (EXUpdatesAsset *asset in assetsForDeletion) {
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
      for (EXUpdatesAsset *asset in erroredAssets) {
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
