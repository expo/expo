//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesReaper.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesReaper

- (void)reapUnusedUpdates
{
  EXUpdatesDatabase *database = [EXUpdatesAppController sharedInstance].database;
  [database.lock lock];
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSURL *updatesDirectory = [EXUpdatesAppController sharedInstance].updatesDirectory;

  NSDate *beginMarkForDeletion = [NSDate date];
  [database markUpdatesForDeletion];
  NSArray<NSDictionary *>* assetsForDeletion = [database markAssetsForDeletion];
  NSLog(@"Marked updates and assets for deletion in %f ms", [beginMarkForDeletion timeIntervalSinceNow] * -1000);

  NSMutableArray<NSNumber *>* deletedAssets = [NSMutableArray new];
  NSMutableArray<NSDictionary *>* erroredAssets = [NSMutableArray new];

  NSDate *beginDeleteAssets = [NSDate date];
  for (NSDictionary *asset in assetsForDeletion) {
    NSAssert([@(1) isEqualToNumber:asset[@"marked_for_deletion"]], @"asset should be marked for deletion");
    NSNumber *assetId = asset[@"id"];
    NSString *relativePath = asset[@"relativePath"];
    NSAssert([assetId isKindOfClass:[NSNumber class]], @"asset id should be a nonnull number");
    NSAssert([relativePath isKindOfClass:[NSString class]], @"relative_path should be a nonnull string");

    NSURL *fileUrl = [updatesDirectory URLByAppendingPathComponent:relativePath];
    NSError *err;
    if ([fileManager removeItemAtURL:fileUrl error:&err]) {
      [deletedAssets addObject:assetId];
    } else {
      [erroredAssets addObject:asset];
      NSLog(@"Error deleting asset at %@: %@", fileUrl, [err localizedDescription]);
    }
  }
  NSLog(@"Deleted %lu assets from disk in %f ms", (unsigned long)[deletedAssets count], [beginDeleteAssets timeIntervalSinceNow] * -1000);

  NSDate *beginRetryDeletes = [NSDate date];
  // retry errored deletions
  for (NSDictionary *asset in erroredAssets) {
    NSNumber *assetId = asset[@"id"];
    NSString *relativePath = asset[@"relativePath"];

    NSURL *fileUrl = [updatesDirectory URLByAppendingPathComponent:relativePath];
    NSError *err;
    if ([fileManager removeItemAtURL:fileUrl error:&err]) {
      [deletedAssets addObject:assetId];
      [erroredAssets removeObject:asset];
    } else {
      NSLog(@"Retried deleting asset at %@ and failed again: %@", fileUrl, [err localizedDescription]);
    }
  }
  NSLog(@"Retried deleting assets from disk in %f ms",[beginRetryDeletes timeIntervalSinceNow] * -1000);

  NSDate *beginDeleteFromDatabase = [NSDate date];
  [database deleteAssetsWithIds:deletedAssets];
  [database deleteUnusedUpdates];
  NSLog(@"Deleted assets and updates from SQLite in %f ms",[beginDeleteFromDatabase timeIntervalSinceNow] * -1000);

  [database.lock unlock];
}

@end

NS_ASSUME_NONNULL_END
