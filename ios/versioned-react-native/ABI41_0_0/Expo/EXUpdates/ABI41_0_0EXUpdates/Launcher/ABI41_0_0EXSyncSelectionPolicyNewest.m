//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncSelectionPolicyNewest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXSyncSelectionPolicyNewest ()

@property (nonatomic, strong) NSArray<NSString *> *runtimeVersions;

@end

@implementation ABI41_0_0EXSyncSelectionPolicyNewest

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
    if (![_runtimeVersions containsObject:update.runtimeVersion]) {
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
  ABI41_0_0EXSyncManifest *nextNewestUpdate;
  for (ABI41_0_0EXSyncManifest *update in updates) {
    if ([launchedUpdate.commitTime compare:update.commitTime] == NSOrderedDescending) {
      [updatesToDelete addObject:update];
      if (!nextNewestUpdate || [update.commitTime compare:nextNewestUpdate.commitTime] == NSOrderedDescending) {
        nextNewestUpdate = update;
      }
    }
  }

  if (nextNewestUpdate) {
    [updatesToDelete removeObject:nextNewestUpdate];
  }
  return updatesToDelete;
}

- (BOOL)shouldLoadNewUpdate:(nullable ABI41_0_0EXSyncManifest *)newUpdate withLaunchedUpdate:(nullable ABI41_0_0EXSyncManifest *)launchedUpdate filters:(nullable NSDictionary *)filters
{
  if (!newUpdate) {
    return false;
  }
  if (!launchedUpdate) {
    return true;
  }
  return [launchedUpdate.commitTime compare:newUpdate.commitTime] == NSOrderedAscending;
}

@end

NS_ASSUME_NONNULL_END
