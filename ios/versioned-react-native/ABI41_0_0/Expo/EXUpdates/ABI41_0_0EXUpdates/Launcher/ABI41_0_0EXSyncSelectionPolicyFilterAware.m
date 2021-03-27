//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncSelectionPolicyFilterAware.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXSyncSelectionPolicyFilterAware ()

@property (nonatomic, strong) NSArray<NSString *> *runtimeVersions;

@end

@implementation ABI41_0_0EXSyncSelectionPolicyFilterAware

- (instancetype)initWithRuntimeVersions:(NSArray<NSString *> *)runtimeVersions
{
  if (self = [super init]) {
    _runtimeVersions = runtimeVersions;
  }
  return self;
}

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion
{
  return [self initWithRuntimeVersions:@[runtimeVersion]];
}

- (nullable ABI41_0_0EXSyncManifest *)launchableUpdateWithUpdates:(NSArray<ABI41_0_0EXSyncManifest *> *)updates filters:(nullable NSDictionary *)filters
{
  ABI41_0_0EXSyncManifest *runnableUpdate;
  NSDate *runnableUpdateCommitTime;
  for (ABI41_0_0EXSyncManifest *update in updates) {
    if (![_runtimeVersions containsObject:update.runtimeVersion] || ![[self class] doesUpdate:update matchFilters:filters]) {
      continue;
    }
    NSDate *commitTime = update.commitTime;
    if (!runnableUpdateCommitTime || [runnableUpdateCommitTime compare:commitTime] == NSOrderedAscending) {
      runnableUpdate = update;
      runnableUpdateCommitTime = commitTime;
    }
  }
  return runnableUpdate;
}

- (NSArray<ABI41_0_0EXSyncManifest *> *)updatesToDeleteWithLaunchedUpdate:(ABI41_0_0EXSyncManifest *)launchedUpdate updates:(NSArray<ABI41_0_0EXSyncManifest *> *)updates filters:(nullable NSDictionary *)filters
{
  if (!launchedUpdate) {
    return @[];
  }

  NSMutableArray<ABI41_0_0EXSyncManifest *> *updatesToDelete = [NSMutableArray new];
  // keep the launched update and one other, the next newest, to be safe and make rollbacks faster
  // keep the next newest update that matches all the manifest filters, unless no other updates do
  // in which case, keep the next newest across all updates
  ABI41_0_0EXSyncManifest *nextNewestUpdate;
  ABI41_0_0EXSyncManifest *nextNewestUpdateMatchingFilters;
  for (ABI41_0_0EXSyncManifest *update in updates) {
    if ([launchedUpdate.commitTime compare:update.commitTime] == NSOrderedDescending) {
      [updatesToDelete addObject:update];
      if (!nextNewestUpdate || [update.commitTime compare:nextNewestUpdate.commitTime] == NSOrderedDescending) {
        nextNewestUpdate = update;
      }
      if ([[self class] doesUpdate:update matchFilters:filters] &&
          (!nextNewestUpdateMatchingFilters || [update.commitTime compare:nextNewestUpdateMatchingFilters.commitTime] == NSOrderedDescending)) {
        nextNewestUpdateMatchingFilters = update;
      }
    }
  }

  if (nextNewestUpdateMatchingFilters) {
    [updatesToDelete removeObject:nextNewestUpdateMatchingFilters];
  } else if (nextNewestUpdate) {
    [updatesToDelete removeObject:nextNewestUpdate];
  }
  return updatesToDelete;
}

- (BOOL)shouldLoadNewUpdate:(nullable ABI41_0_0EXSyncManifest *)newUpdate withLaunchedUpdate:(nullable ABI41_0_0EXSyncManifest *)launchedUpdate filters:(nullable NSDictionary *)filters
{
  if (!newUpdate) {
    return NO;
  }
  // if the new update doesn't match its own filters, we shouldn't load it
  if (![[self class] doesUpdate:newUpdate matchFilters:filters]) {
    return NO;
  }

  if (!launchedUpdate) {
    return YES;
  }
  // if the current update doesn't pass the manifest filters
  // we should load the new update no matter the commitTime
  if (![[self class] doesUpdate:launchedUpdate matchFilters:filters]) {
    return YES;
  }
  return [launchedUpdate.commitTime compare:newUpdate.commitTime] == NSOrderedAscending;
}

+ (BOOL)doesUpdate:(ABI41_0_0EXSyncManifest *)update matchFilters:(nullable NSDictionary *)filters
{
  if (!filters || !update.metadata) {
    return YES;
  }

  NSDictionary *updateMetadata = update.metadata[@"updateMetadata"];
  if (!updateMetadata || ![updateMetadata isKindOfClass:[NSDictionary class]]) {
    return YES;
  }

  // create lowercase copy for case-insensitive search
  NSMutableDictionary *metadataLCKeys = [NSMutableDictionary dictionaryWithCapacity:updateMetadata.count];
  [updateMetadata enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
    if ([key isKindOfClass:[NSString class]]) {
      metadataLCKeys[((NSString *)key).lowercaseString] = obj;
    }
  }];

  __block BOOL passes = YES;
  [filters enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
    id valueFromManifest = metadataLCKeys[key];
    if (valueFromManifest) {
      passes = [obj isEqual:valueFromManifest];
    }

    // once an update fails one filter, break early; we don't need to check the rest
    if (!passes) {
      *stop = YES;
    }
  }];

  return passes;
}

@end

NS_ASSUME_NONNULL_END
