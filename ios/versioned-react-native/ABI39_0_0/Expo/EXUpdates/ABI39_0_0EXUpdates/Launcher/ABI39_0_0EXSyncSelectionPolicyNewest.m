//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncSelectionPolicyNewest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXSyncSelectionPolicyNewest ()

@property (nonatomic, strong) NSArray<NSString *> *runtimeVersions;

@end

@implementation ABI39_0_0EXSyncSelectionPolicyNewest

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

- (nullable ABI39_0_0EXSyncManifest *)launchableUpdateWithUpdates:(NSArray<ABI39_0_0EXSyncManifest *> *)updates
{
  ABI39_0_0EXSyncManifest *runnableUpdate;
  NSDate *runnableUpdateCommitTime;
  for (ABI39_0_0EXSyncManifest *update in updates) {
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

- (NSArray<ABI39_0_0EXSyncManifest *> *)updatesToDeleteWithLaunchedUpdate:(ABI39_0_0EXSyncManifest *)launchedUpdate updates:(NSArray<ABI39_0_0EXSyncManifest *> *)updates
{
  if (!launchedUpdate) {
    return @[];
  }

  NSMutableArray<ABI39_0_0EXSyncManifest *> *updatesToDelete = [NSMutableArray new];
  for (ABI39_0_0EXSyncManifest *update in updates) {
    if ([launchedUpdate.commitTime compare:update.commitTime] == NSOrderedDescending) {
      [updatesToDelete addObject:update];
    }
  }
  return updatesToDelete;
}

- (BOOL)shouldLoadNewUpdate:(nullable ABI39_0_0EXSyncManifest *)newUpdate withLaunchedUpdate:(nullable ABI39_0_0EXSyncManifest *)launchedUpdate
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
