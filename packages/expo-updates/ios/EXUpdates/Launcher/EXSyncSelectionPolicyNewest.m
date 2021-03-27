//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncConfig.h>
#import <EXUpdates/EXSyncSelectionPolicyNewest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncSelectionPolicyNewest ()

@property (nonatomic, strong) NSArray<NSString *> *runtimeVersions;

@end

@implementation EXSyncSelectionPolicyNewest

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

- (nullable EXSyncManifest *)launchableUpdateWithUpdates:(NSArray<EXSyncManifest *> *)updates filters:(nullable NSDictionary *)filters
{
  EXSyncManifest *runnableUpdate;
  NSDate *runnableUpdateCommitTime;
  for (EXSyncManifest *update in updates) {
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

- (NSArray<EXSyncManifest *> *)updatesToDeleteWithLaunchedUpdate:(EXSyncManifest *)launchedUpdate updates:(NSArray<EXSyncManifest *> *)updates filters:(nullable NSDictionary *)filters
{
  if (!launchedUpdate) {
    return @[];
  }

  NSMutableArray<EXSyncManifest *> *updatesToDelete = [NSMutableArray new];
  // keep the launched update and one other, the next newest, to be safe and make rollbacks faster
  EXSyncManifest *nextNewestUpdate;
  for (EXSyncManifest *update in updates) {
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

- (BOOL)shouldLoadNewUpdate:(nullable EXSyncManifest *)newUpdate withLaunchedUpdate:(nullable EXSyncManifest *)launchedUpdate filters:(nullable NSDictionary *)filters
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
