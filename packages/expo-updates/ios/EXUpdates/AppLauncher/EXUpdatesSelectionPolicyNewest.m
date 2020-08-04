//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesSelectionPolicyNewest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesSelectionPolicyNewest ()

@property (nonatomic, strong) NSArray<NSString *> *runtimeVersions;

@end

@implementation EXUpdatesSelectionPolicyNewest

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

- (nullable EXUpdatesUpdate *)launchableUpdateWithUpdates:(NSArray<EXUpdatesUpdate *> *)updates
{
  EXUpdatesUpdate *runnableUpdate;
  NSDate *runnableUpdateCommitTime;
  for (EXUpdatesUpdate *update in updates) {
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

- (NSArray<EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(EXUpdatesUpdate *)launchedUpdate updates:(NSArray<EXUpdatesUpdate *> *)updates
{
  if (!launchedUpdate) {
    return @[];
  }

  NSMutableArray<EXUpdatesUpdate *> *updatesToDelete = [NSMutableArray new];
  for (EXUpdatesUpdate *update in updates) {
    if ([launchedUpdate.commitTime compare:update.commitTime] == NSOrderedDescending) {
      [updatesToDelete addObject:update];
    }
  }
  return updatesToDelete;
}

- (BOOL)shouldLoadNewUpdate:(nullable EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate
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
